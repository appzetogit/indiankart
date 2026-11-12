import API from '../services/api';

// Reports a shopping action (add to cart, Buy Now, ...) for the admin Product
// Views page. Fire-and-forget: it never waits, never throws, and never blocks
// the button that called it.
export const trackShopEvent = (type, product, { variant, quantity = 1, price } = {}) => {
    try {
        const productId = Number(product?.id ?? product?.productId ?? product);
        if (!type || !Number.isFinite(productId)) return;
        const unitPrice = Number(price ?? product?.price);
        API.post('/shop-events', {
            type,
            productId,
            variant: variant ?? product?.variant ?? {},
            quantity: Math.max(1, Number(quantity) || 1),
            price: Number.isFinite(unitPrice) ? unitPrice : undefined
        }, { timeout: 8000 }).catch(() => {});
    } catch {
        // Tracking must never break shopping.
    }
};
