import Razorpay from 'razorpay';
import crypto from 'crypto';
import Setting from '../models/Setting.js';
import PendingCheckout from '../models/PendingCheckout.js';

const getRazorpayCredentials = async () => {
    const settings = await Setting.findOne().select('+razorpayKeySecret razorpayKeyId').lean();
    const keyId = settings?.razorpayKeyId?.trim() || '';
    const keySecret = settings?.razorpayKeySecret?.trim() || '';
    return { keyId, keySecret };
};

// @desc    Create Razorpay order
// @route   POST /api/payments/order
// @access  Private
export const createRazorpayOrder = async (req, res) => {
    const { amount, offer_id, orderData } = req.body;
    console.log(`Processing Razorpay order request - Amount: Rs ${amount}, Offer ID: ${offer_id || 'none'}`);

    try {
        const { keyId, keySecret } = await getRazorpayCredentials();

        console.log('Razorpay Config Check:', {
            keyIdPresent: !!keyId,
            keySecretPresent: !!keySecret,
            source: keyId && keySecret ? 'admin_settings' : 'missing'
        });

        if (!keyId || !keySecret) {
            throw new Error('Razorpay credentials are not configured');
        }

        const instance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        const options = {
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        };

        // If a Razorpay offer_id is provided, attach it to the order
        // Razorpay will validate the offer and auto-apply the discount during checkout
        if (offer_id && typeof offer_id === 'string' && offer_id.startsWith('offer_')) {
            options.offer_id = offer_id;
        }

        const order = await instance.orders.create(options);

        if (!order) {
            return res.status(500).send('Some error occured');
        }

        // Keep what the customer is buying, so the order can still be created if
        // they pay but never make it back from the payment page.
        if (orderData && typeof orderData === 'object' && Array.isArray(orderData.orderItems) && orderData.orderItems.length) {
            const { paymentResult, isPaid, paidAt, ...orderPayload } = orderData;
            try {
                await PendingCheckout.create({
                    razorpayOrderId: order.id,
                    user: req.user._id,
                    orderPayload,
                    amount: order.amount,
                });
            } catch (saveError) {
                // The browser path still works without it; do not block payment.
                console.error(`Pending checkout save failed for ${order.id}:`, saveError.message);
            }
        }

        return res.json(order);
    } catch (error) {
        console.error('Razorpay Order Creation Error:', error);
        return res.status(500).json({ message: error.message, details: error.error });
    }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res) => {
    try {
        const { keyId, keySecret } = await getRazorpayCredentials();
        if (!keyId || !keySecret) {
            return res.status(500).json({ message: 'Razorpay credentials are not configured' });
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const body = `${razorpay_order_id}|${razorpay_payment_id}`;

        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            return res.status(400).json({ message: 'Invalid signature' });
        }

        const instance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        const payment = await instance.payments.fetch(razorpay_payment_id);
        const normalizedGatewayStatus = String(payment?.status || '').trim().toLowerCase();
        const fetchedOrderId = String(payment?.order_id || '').trim();
        const isCaptured = payment?.captured === true || normalizedGatewayStatus === 'captured';

        if (fetchedOrderId && fetchedOrderId !== String(razorpay_order_id || '').trim()) {
            return res.status(400).json({ message: 'Payment order mismatch' });
        }

        if (!isCaptured) {
            return res.status(400).json({
                message: 'Payment was not captured successfully',
                gatewayStatus: normalizedGatewayStatus || 'unknown'
            });
        }

        let cardInfo = null;
        if (payment.method === 'card' && payment.card) {
            cardInfo = {
                network: payment.card.network,
                last4: payment.card.last4,
                type: payment.card.type
            };
        }

        return res.json({
            message: 'Payment verified successfully',
            paymentId: razorpay_payment_id,
            gatewayStatus: normalizedGatewayStatus,
            isCaptured,
            cardInfo
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getWebhookSecret = async () => {
    const settings = await Setting.findOne().select('+razorpayWebhookSecret').lean();
    return settings?.razorpayWebhookSecret?.trim() || process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || '';
};

const signatureMatches = (rawBody, signature, secret) => {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const given = String(signature || '');
    return given.length === expected.length
        && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
};

// @desc    Razorpay webhook (payment.captured, order.paid, payment.failed)
// @route   POST /api/payments/webhook
// @access  Public, authenticated by X-Razorpay-Signature
//
// Only records what Razorpay reported and answers at once; the order itself is
// built by the payment reconciler, which re-reads the payment from Razorpay
// before trusting it. So a forged or replayed event cannot create a paid order.
export const handleRazorpayWebhook = async (req, res) => {
    try {
        const secret = await getWebhookSecret();
        if (!secret) {
            console.error('Razorpay webhook received but no webhook secret is configured');
            return res.status(503).json({ message: 'Webhook not configured' });
        }
        if (!req.rawBody || !signatureMatches(req.rawBody, req.headers['x-razorpay-signature'], secret)) {
            return res.status(400).json({ message: 'Invalid signature' });
        }

        const event = String(req.body?.event || '');
        const payment = req.body?.payload?.payment?.entity || null;
        const razorpayOrderId = String(payment?.order_id || req.body?.payload?.order?.entity?.id || '');

        if (!razorpayOrderId) {
            return res.json({ ok: true, ignored: 'no order id' });
        }

        if (event === 'payment.captured' || event === 'order.paid') {
            const result = await PendingCheckout.updateOne(
                { razorpayOrderId, status: 'pending' },
                {
                    paymentId: payment?.id || '',
                    capturedAt: new Date(),
                    lastCheckedAt: null,
                }
            );
            console.log(`Razorpay webhook ${event} for ${razorpayOrderId}: ${result.matchedCount ? 'queued for order check' : 'no pending checkout'}`);
        } else if (event === 'payment.failed') {
            await PendingCheckout.updateOne(
                { razorpayOrderId, status: 'pending' },
                { lastError: String(payment?.error_description || payment?.error_reason || 'payment failed').slice(0, 300) }
            );
            console.log(`Razorpay webhook payment.failed for ${razorpayOrderId}: ${payment?.error_reason || 'unknown reason'}`);
        }

        return res.json({ ok: true });
    } catch (error) {
        console.error('Razorpay webhook error:', error);
        // 5xx makes Razorpay retry, which is what we want for a transient fault.
        return res.status(500).json({ message: 'Webhook processing failed' });
    }
};

// @desc    Get Razorpay public config
// @route   GET /api/payments/config
// @access  Private
export const getRazorpayConfig = async (req, res) => {
    try {
        const { keyId } = await getRazorpayCredentials();
        return res.json({ keyId: keyId || '' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Get Razorpay availability for public pages
// @route   GET /api/payments/status
// @access  Public
export const getRazorpayStatus = async (req, res) => {
    try {
        const { keyId, keySecret } = await getRazorpayCredentials();
        return res.json({ enabled: Boolean(keyId && keySecret) });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Test Razorpay credentials
// @route   GET /api/payments/test-credentials
// @access  Private/Admin
export const testRazorpayCredentials = async (req, res) => {
    try {
        const { keyId, keySecret } = await getRazorpayCredentials();
        if (!keyId || !keySecret) {
            return res.status(500).json({
                success: false,
                message: 'Razorpay credentials are missing',
                keyId: keyId || '',
                hint: 'Save Razorpay Key ID and Key Secret in Admin > API Credentials'
            });
        }

        const instance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        const options = {
            amount: 100,
            currency: 'INR',
            receipt: `test_receipt_${Date.now()}`,
        };

        const order = await instance.orders.create(options);

        if (!order) {
            return res.status(500).json({
                success: false,
                message: 'Unable to validate Razorpay credentials right now'
            });
        }

        return res.json({
            success: true,
            message: 'Razorpay credentials are valid!',
            testOrderId: order.id,
            keyId
        });
    } catch (error) {
        const { keyId } = await getRazorpayCredentials();
        return res.status(500).json({
            success: false,
            message: "Razorpay credentials are invalid or there's an API issue",
            error: error.message,
            keyId,
            hint: 'Please check your Razorpay keys in Admin > API Credentials'
        });
    }
};
