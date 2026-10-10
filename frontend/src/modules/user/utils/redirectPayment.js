import API from '../../../services/api';

const STORAGE_KEY = 'ik_redirect_payment';

// Server codes for a payment that will never become an order (see
// backend/utils/paymentRejection.js). Shown as "Payment not confirmed".
export const REJECTED_PAYMENT_CODES = [
    'PAYMENT_AMOUNT_MISMATCH',
    'PAYMENT_ORDER_MISMATCH',
    'PAYMENT_ALREADY_USED',
    'PAYMENT_SIGNATURE_INVALID',
];

// On phones the bank's 3-D Secure page often stays blank inside Razorpay's
// popup (especially in WhatsApp / Instagram in-app browsers). Redirect mode
// opens it as a normal full page instead and brings the customer back to
// /payment-status, where the server has already built the order.
export const shouldUseRedirectPayment = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const inAppBrowser = /FBAN|FBAV|Instagram|WhatsApp|Line\/|; wv\)|Snapchat|Twitter/i.test(ua);
    const phone = /Android|iPhone|iPod|Mobile/i.test(ua);
    return inAppBrowser || phone;
};

export const paymentCallbackUrl = () => {
    const base = String(API.defaults.baseURL || '').replace(/\/+$/, '');
    return `${base}/payments/callback`;
};

// What the in-page flow would have done on success, remembered across the
// trip to the bank's page.
export const rememberPendingRedirectPayment = ({ razorpayOrderId, clearCart, hadCoupon }) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ razorpayOrderId, clearCart, hadCoupon, at: Date.now() }));
    } catch {
        // Storage unavailable: the status page falls back to clearing the cart.
    }
};

export const readPendingRedirectPayment = (razorpayOrderId) => {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        return saved && saved.razorpayOrderId === razorpayOrderId ? saved : null;
    } catch {
        return null;
    }
};

export const clearPendingRedirectPayment = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore
    }
};
