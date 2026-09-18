// Purchase tracking for Google Analytics 4 and Google Ads.
//
// The Google tag in index.html loads both destinations and already records
// page views, including in-app navigation (GA4 enhanced measurement picks up
// history changes), so page views must NOT be sent from here - that would
// double-count. What it cannot see on its own is a completed order, which is
// what Google Ads needs to measure conversions and optimise spend.

const GOOGLE_ADS_ID = 'AW-18458044238';

// Conversion label for the "Purchase" conversion action, from Google Ads:
// Goals > Conversions > (the purchase action) > Tag setup > "Install the tag
// yourself" - the part after the slash in send_to: 'AW-18458044238/XXXXXXX'.
//
// Leave empty until that action exists. Purchases still reach GA4 as the
// standard `purchase` event, which Google Ads can import as a conversion once
// GA4 and Ads are linked. Use ONE of the two, not both, or every sale counts
// twice.
const GOOGLE_ADS_PURCHASE_LABEL = '';

const SENT_KEY_PREFIX = 'analytics:purchase-sent:';

const sendToGoogle = (...args) => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag(...args);
    }
};

const alreadySent = (orderId) => {
    try {
        return window.localStorage.getItem(`${SENT_KEY_PREFIX}${orderId}`) === '1';
    } catch {
        return false;
    }
};

const markSent = (orderId) => {
    try {
        window.localStorage.setItem(`${SENT_KEY_PREFIX}${orderId}`, '1');
    } catch {
        // Storage can be unavailable (private mode). transaction_id still lets
        // both GA4 and Ads de-duplicate on their side.
    }
};

/**
 * Report a completed order. Call once, immediately after the server has
 * created it - with the order the API returned, not the cart.
 * Never throws: analytics must not be able to break checkout.
 */
export const trackPurchase = (order) => {
    try {
        const transactionId = String(order?.displayId || order?._id || order?.id || '').trim();
        if (!transactionId || alreadySent(transactionId)) return;

        const value = Number(order?.totalPrice) || 0;
        const items = (Array.isArray(order?.orderItems) ? order.orderItems : []).map((item) => ({
            item_id: String(item?.product?._id || item?.product || item?._id || ''),
            item_name: String(item?.name || ''),
            item_variant: item?.variant && typeof item.variant === 'object'
                ? Object.values(item.variant).filter(Boolean).join(' / ')
                : undefined,
            price: Number(item?.price) || 0,
            quantity: Number(item?.qty) || 1,
        }));

        sendToGoogle('event', 'purchase', {
            transaction_id: transactionId,
            value,
            currency: 'INR',
            tax: Number(order?.taxPrice) || 0,
            shipping: Number(order?.shippingPrice) || 0,
            coupon: order?.coupon?.code || undefined,
            items,
        });

        if (GOOGLE_ADS_PURCHASE_LABEL) {
            sendToGoogle('event', 'conversion', {
                send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PURCHASE_LABEL}`,
                value,
                currency: 'INR',
                transaction_id: transactionId,
            });
        }

        markSent(transactionId);
    } catch (error) {
        console.error('Purchase tracking failed:', error);
    }
};
