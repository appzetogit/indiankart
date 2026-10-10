import Razorpay from 'razorpay';
import Setting from '../models/Setting.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import PendingCheckout from '../models/PendingCheckout.js';
import { addOrderItems } from '../controllers/orderController.js';
import { REJECTED_PAYMENT_CODES } from './paymentRejection.js';

// A captured payment is left alone this long so the customer's own browser,
// which is normally a few seconds behind Razorpay, gets to create the order
// and show the success page. Only after that does the server step in.
const BROWSER_GRACE_MS = 90 * 1000;
// Checkouts with no captured payment are re-checked until this old; after that
// Razorpay will not capture them any more and they are marked abandoned.
const GIVE_UP_AFTER_MS = 48 * 60 * 60 * 1000;
// Failed attempts at creating the order (not checks) before handing to a human.
const MAX_CREATE_ATTEMPTS = 5;
const LEASE_MS = 2 * 60 * 1000;
const BATCH_SIZE = 25;

const getRazorpayInstance = async () => {
    const settings = await Setting.findOne().select('+razorpayKeySecret razorpayKeyId').lean();
    const keyId = settings?.razorpayKeyId?.trim() || '';
    const keySecret = settings?.razorpayKeySecret?.trim() || '';
    if (!keyId || !keySecret) {
        throw new Error('Razorpay credentials are not configured');
    }
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// Backoff between checks of one checkout: 1, 2, 4 … capped at an hour.
const nextCheckDelayMs = (attempts) => Math.min(60, 2 ** Math.max(0, attempts - 1)) * 60 * 1000;

const findOrderForRazorpayOrder = (razorpayOrderId) =>
    Order.findOne({ 'paymentResult.razorpay_order_id': razorpayOrderId }).select('_id').lean();

const loadUser = async (userId) =>
    (await User.findById(userId).select('-password')) || (await Admin.findById(userId).select('-password'));

// Runs addOrderItems exactly as POST /orders would, so the order gets the same
// price recalculation, captured-amount check, stock handling and idempotency
// (PaymentClaim) as one placed from the browser.
const runAddOrderItems = async (user, body, requestId) => {
    let statusCode = 200;
    let payload;
    const res = {
        status(code) { statusCode = code; return this; },
        json(data) { payload = data; return this; },
        send(data) { payload = data; return this; },
    };
    await addOrderItems({ body, user, requestId, headers: {}, cookies: {} }, res);
    return { statusCode, payload };
};

const notifyAdminNeedsReview = (checkout, reason) =>
    Notification.create({
        type: 'order',
        title: 'Paid checkout needs attention',
        message: `Payment ${checkout.paymentId || '(unknown)'} for Razorpay order ${checkout.razorpayOrderId} was captured but the order could not be created automatically: ${reason}`,
        relatedId: checkout.razorpayOrderId,
    }).catch((error) => console.error('[payment-recovery] admin notification failed:', error.message));

const release = (checkout, update) =>
    PendingCheckout.updateOne({ _id: checkout._id }, { ...update, lockedUntil: null });

/**
 * Bring one pending checkout to a final state if it can be.
 * Returns a short outcome string (used in logs and tests).
 */
export const processPendingCheckout = async (checkoutId, { source = 'reconciler', razorpay } = {}) => {
    const now = new Date();
    const checkout = await PendingCheckout.findOneAndUpdate(
        {
            _id: checkoutId,
            status: 'pending',
            $or: [{ lockedUntil: null }, { lockedUntil: { $lt: now } }],
        },
        { lockedUntil: new Date(now.getTime() + LEASE_MS), lastCheckedAt: now, $inc: { attempts: 1 } },
        { new: true }
    );
    if (!checkout) return 'skipped';

    try {
        // The browser usually wins; nothing to do then.
        const existing = await findOrderForRazorpayOrder(checkout.razorpayOrderId);
        if (existing) {
            await release(checkout, { status: 'completed', order: existing._id, completedBy: checkout.completedBy || 'browser' });
            return 'already_ordered';
        }

        const instance = razorpay || await getRazorpayInstance();
        const { items = [] } = await instance.orders.fetchPayments(checkout.razorpayOrderId);
        const captured = items.find((p) => p.status === 'captured' || p.captured === true);

        if (!captured) {
            const age = now.getTime() - new Date(checkout.createdAt).getTime();
            const lastFailure = items.find((p) => p.status === 'failed');
            if (age > GIVE_UP_AFTER_MS) {
                await release(checkout, { status: items.some((p) => p.status === 'failed') ? 'failed' : 'abandoned' });
                return 'abandoned';
            }
            await release(checkout, {
                lastError: lastFailure ? (lastFailure.error_description || lastFailure.error_reason || 'payment failed') : checkout.lastError,
            });
            return items.some((p) => p.status === 'authorized') ? 'authorized_waiting' : 'not_paid';
        }

        // Razorpay's payment entity has no capture time, so the grace period runs
        // from when the capture was first seen (by webhook or by this check).
        const capturedAt = checkout.capturedAt || now;
        if (!checkout.browserGone && now.getTime() - capturedAt.getTime() < BROWSER_GRACE_MS) {
            await release(checkout, { paymentId: captured.id, capturedAt, attempts: Math.max(0, checkout.attempts - 1) });
            return 'grace';
        }

        const user = await loadUser(checkout.user);
        if (!user) {
            const reason = 'customer account no longer exists';
            await release(checkout, { status: 'needs_review', paymentId: captured.id, capturedAt, lastError: reason });
            await notifyAdminNeedsReview({ ...checkout.toObject(), paymentId: captured.id }, reason);
            return 'needs_review';
        }

        const body = {
            ...checkout.orderPayload,
            paymentResult: {
                id: captured.id,
                razorpay_payment_id: captured.id,
                razorpay_order_id: checkout.razorpayOrderId,
                status: 'captured',
                update_time: new Date().toISOString(),
                recovered_by: source,
            },
            isPaid: true,
            paidAt: capturedAt.toISOString(),
        };
        const { statusCode, payload } = await runAddOrderItems(user, body, `recover-${checkout.razorpayOrderId}`);
        const createAttempts = (checkout.createAttempts || 0) + 1;

        if ((statusCode === 200 || statusCode === 201) && payload?._id) {
            await release(checkout, {
                status: 'completed',
                order: payload._id,
                paymentId: captured.id,
                capturedAt,
                completedBy: statusCode === 201 ? source : (checkout.completedBy || 'browser'),
                lastError: '',
            });
            if (statusCode === 201) {
                console.log(`[payment-recovery] created order ${payload._id} for ${checkout.razorpayOrderId} (${source})`);
            }
            return statusCode === 201 ? 'created' : 'already_ordered';
        }

        const message = String(payload?.message || `HTTP ${statusCode}`);
        // The money does not match this order: addOrderItems has already logged
        // it and told admins. Never retry; never turn it into an order.
        if (REJECTED_PAYMENT_CODES.has(payload?.code)) {
            await release(checkout, {
                status: 'rejected',
                rejectionCode: payload.code,
                paymentId: captured.id,
                capturedAt,
                paidAmount: payload.details?.paidAmount,
                expectedAmount: payload.details?.expectedAmount,
                lastError: message,
                createAttempts,
            });
            return 'rejected';
        }
        // 409 "already being processed" means the browser holds the payment claim
        // right now; try again shortly. Anything else 4xx will not fix itself.
        const transient = statusCode >= 500 || (statusCode === 409 && !/insufficient stock/i.test(message));
        if (transient && createAttempts < MAX_CREATE_ATTEMPTS) {
            await release(checkout, { paymentId: captured.id, capturedAt, lastError: message, createAttempts });
            return 'retry';
        }
        await release(checkout, { status: 'needs_review', paymentId: captured.id, capturedAt, lastError: message, createAttempts });
        await notifyAdminNeedsReview({ ...checkout.toObject(), paymentId: captured.id }, message);
        console.error(`[payment-recovery] ${checkout.razorpayOrderId} needs review: ${message}`);
        return 'needs_review';
    } catch (error) {
        console.error(`[payment-recovery] ${checkout.razorpayOrderId} check failed:`, error?.message || error?.error?.description || error);
        const tooOld = now.getTime() - new Date(checkout.createdAt).getTime() > GIVE_UP_AFTER_MS;
        await release(checkout, {
            ...(tooOld ? { status: 'abandoned' } : {}),
            lastError: String(error?.message || error?.error?.description || `check failed (HTTP ${error?.statusCode || '?'})`),
        }).catch(() => {});
        return 'error';
    }
};

/** One pass over every checkout that is due a check. */
export const reconcilePendingCheckouts = async ({ razorpay } = {}) => {
    const now = Date.now();
    const due = await PendingCheckout.find({
        status: 'pending',
        $or: [{ lockedUntil: null }, { lockedUntil: { $lt: new Date(now) } }],
    })
        .sort({ createdAt: 1 })
        .limit(BATCH_SIZE * 4)
        .select('_id attempts createdAt capturedAt lastCheckedAt')
        .lean();

    const outcomes = {};
    let processed = 0;
    for (const checkout of due) {
        if (processed >= BATCH_SIZE) break;
        const created = new Date(checkout.createdAt).getTime();
        const lastChecked = checkout.lastCheckedAt ? new Date(checkout.lastCheckedAt).getTime() : 0;
        const signalled = Boolean(checkout.capturedAt);
        // Give the customer time to finish paying before the first look, unless
        // a webhook already said the money is in.
        if (!signalled && now - created < BROWSER_GRACE_MS) continue;
        if (!signalled && lastChecked && now - lastChecked < nextCheckDelayMs(checkout.attempts)) continue;
        processed += 1;
        const outcome = await processPendingCheckout(checkout._id, { razorpay });
        outcomes[outcome] = (outcomes[outcome] || 0) + 1;
    }
    return outcomes;
};

let reconcilerTimer = null;
let reconcilerRunning = false;

export const startPaymentReconciler = ({ intervalMs = 60 * 1000 } = {}) => {
    if (reconcilerTimer) return;
    const tick = async () => {
        if (reconcilerRunning) return;
        reconcilerRunning = true;
        try {
            const outcomes = await reconcilePendingCheckouts();
            if (outcomes.created || outcomes.needs_review || outcomes.error) {
                console.log('[payment-recovery] pass:', JSON.stringify(outcomes));
            }
        } catch (error) {
            console.error('[payment-recovery] pass failed:', error.message);
        } finally {
            reconcilerRunning = false;
        }
    };
    reconcilerTimer = setInterval(tick, intervalMs);
    reconcilerTimer.unref?.();
    console.log(`[payment-recovery] reconciler running every ${Math.round(intervalMs / 1000)}s`);
};
