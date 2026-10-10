import Notification from '../models/Notification.js';
import PendingCheckout from '../models/PendingCheckout.js';

// Payment problems that will never turn into an order by waiting: the money
// that arrived does not belong to, or does not cover, this order. Shown to the
// customer as "Payment not confirmed"; the money stays held for an admin to
// decide (no automatic refund).
export const REJECTED_PAYMENT_CODES = new Set([
    'PAYMENT_AMOUNT_MISMATCH',
    'PAYMENT_ORDER_MISMATCH',
    'PAYMENT_ALREADY_USED',
    'PAYMENT_SIGNATURE_INVALID',
]);

export const paymentError = (code, message, details = {}, statusCode = 400) => {
    const error = new Error(message);
    error.code = code;
    error.statusCode = statusCode;
    error.details = details;
    return error;
};

const describe = (code, details) => {
    const paid = details.paidAmount !== undefined ? `Rs ${details.paidAmount}` : 'an amount';
    switch (code) {
        case 'PAYMENT_AMOUNT_MISMATCH':
            return `${paid} was paid but the order total is Rs ${details.expectedAmount}`;
        case 'PAYMENT_ORDER_MISMATCH':
            return 'the payment belongs to a different Razorpay order';
        case 'PAYMENT_ALREADY_USED':
            return 'the payment was already used for another order';
        default:
            return 'the payment could not be verified';
    }
};

/**
 * Record a rejected payment: log it, stop the reconciler retrying it, and tell
 * admins once per payment. Never throws.
 */
export const recordRejectedPayment = async ({ code, details = {}, user, orderItems = [] }) => {
    try {
        const paymentId = String(details.paymentId || '');
        const razorpayOrderId = String(details.razorpayOrderId || '');
        const who = user ? `${user.name || 'Customer'} (${user.phone || user.mobile || user.email || user._id})` : 'unknown customer';
        const items = (orderItems || []).map((item) => `${item.name || item.product} x${item.qty || item.quantity || 1}`).join(', ');
        console.warn(`[payment-rejected] ${code} payment=${paymentId || '-'} order=${razorpayOrderId || '-'} user=${user?._id || '-'} paid=${details.paidAmount ?? '-'} expected=${details.expectedAmount ?? '-'}`);

        if (razorpayOrderId) {
            await PendingCheckout.updateOne(
                { razorpayOrderId, status: { $in: ['pending', 'needs_review'] } },
                {
                    status: 'rejected',
                    rejectionCode: code,
                    paymentId: paymentId || undefined,
                    paidAmount: details.paidAmount,
                    expectedAmount: details.expectedAmount,
                    lastError: describe(code, details),
                    lockedUntil: null,
                }
            );
        }

        const relatedId = paymentId || razorpayOrderId;
        if (relatedId && !(await Notification.exists({ relatedId, title: '⚠ Payment not confirmed' }))) {
            await Notification.create({
                type: 'order',
                title: '⚠ Payment not confirmed',
                message: `Order NOT placed for ${who}: ${describe(code, details)}. Payment ${paymentId || '-'} (Razorpay order ${razorpayOrderId || '-'}). Items: ${items || '-'}. The money is held: refund it from the Razorpay dashboard if appropriate.`,
                relatedId,
            });
        }
    } catch (error) {
        console.error('[payment-rejected] could not record:', error.message);
    }
};
