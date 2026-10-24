import Product from '../models/Product.js';
import Setting from '../models/Setting.js';
import Coupon from '../models/Coupon.js';

export const normalizeVariantObject = (variant) => {
    if (!variant || typeof variant !== 'object' || Array.isArray(variant)) {
        return {};
    }
    const source = variant instanceof Map ? Object.fromEntries(variant) : variant;
    return Object.entries(source).reduce((acc, [key, value]) => {
        const normalizedKey = String(key || '').trim();
        const normalizedValue = String(value || '').trim();
        if (!normalizedKey || !normalizedValue) return acc;
        acc[normalizedKey] = normalizedValue;
        return acc;
    }, {});
};

// Single source of truth for variant -> SKU matching. Stock validation, stock
// decrement and stock restore must all agree, or an order can pass the check
// but miss the SKU when its stock is reduced.
export const findMatchingSkuIndexForVariant = (product, variant) => {
    const normalizedVariant = normalizeVariantObject(variant);
    const itemKeys = Object.keys(normalizedVariant);
    if (!itemKeys.length) return -1;

    return (Array.isArray(product?.skus) ? product.skus : []).findIndex((sku) => {
        const combination = normalizeVariantObject(sku?.combination);
        const combinationKeys = Object.keys(combination);

        if (itemKeys.length !== combinationKeys.length) return false;
        return itemKeys.every((key) => normalizedVariant[key] === combination[key]);
    });
};

export const findMatchingSkuForVariant = (product, variant) => {
    const index = findMatchingSkuIndexForVariant(product, variant);
    return index === -1 ? null : product.skus[index];
};

const MAX_ORDER_LINES = 50;
const MAX_LINE_QUANTITY = 100;

const badItems = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
};

/**
 * The only shape of order lines the server works with. Quantities must be
 * whole numbers from 1 to 100: a negative quantity used to subtract from the
 * total (₹50,000 × 1 + ₹49,999 × −1 = ₹1) and add to stock. Duplicate lines
 * for the same product and variant are merged so per-product limits can't be
 * dodged by splitting. Only id, quantity and variant are trusted; name and
 * image are kept for messages and checked against the product later.
 */
export const normalizeOrderItems = (orderItems) => {
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        throw badItems('No order items');
    }
    if (orderItems.length > MAX_ORDER_LINES) {
        throw badItems(`An order can have at most ${MAX_ORDER_LINES} items.`);
    }

    const merged = new Map();
    for (const raw of orderItems) {
        if (!raw || typeof raw !== 'object') throw badItems('Invalid order item.');
        const product = Number(raw.product ?? raw._id ?? raw.id);
        if (!Number.isFinite(product)) throw badItems('Invalid product in order.');

        const rawQty = raw.qty ?? raw.quantity;
        const qty = typeof rawQty === 'string' && rawQty.trim() !== '' ? Number(rawQty) : rawQty;
        if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1 || qty > MAX_LINE_QUANTITY) {
            throw badItems(`Invalid quantity for ${String(raw.name || 'an item').slice(0, 80)}.`);
        }

        const variant = normalizeVariantObject(raw.variant);
        const key = `${product}|${JSON.stringify(Object.keys(variant).sort().map((k) => [k, variant[k]]))}`;
        const existing = merged.get(key);
        if (existing) {
            existing.qty += qty;
            if (existing.qty > MAX_LINE_QUANTITY) {
                throw badItems(`Invalid quantity for ${existing.name || 'an item'}.`);
            }
        } else {
            merged.set(key, {
                product,
                qty,
                variant,
                name: typeof raw.name === 'string' ? raw.name.slice(0, 200) : '',
                image: typeof raw.image === 'string' && raw.image.length < 1000 ? raw.image : '',
            });
        }
    }
    return [...merged.values()];
};

export const calculateOrderPrices = async ({ orderItems: rawOrderItems, shippingAddress, coupon }) => {
    let calculatedItemsPrice = 0;

    const orderItems = normalizeOrderItems(rawOrderItems);
    const productIds = [...new Set(orderItems.map((item) => Number(item.product || item._id)))];
    const [products, settings] = await Promise.all([
        Product.find({ id: { $in: productIds } }),
        Setting.findOne().lean()
    ]);
    const productsById = new Map(products.map((product) => [Number(product.id), product]));

    // 1. Calculate base items price using DB prices
    for (const item of orderItems) {
        const product = productsById.get(Number(item.product || item._id));
        if (!product) {
            throw new Error(`Product not found: ${item.name}`);
        }
        // Hidden products cannot be bought, even from an old cart or wishlist.
        if (product.isVisible === false) {
            const error = new Error(`${item.name || 'This product'} is no longer available. Please remove it from your cart.`);
            error.statusCode = 400;
            throw error;
        }

        let price = product.price;
        if (item.variant && Object.keys(item.variant).length > 0) {
            const matchingSku = findMatchingSkuForVariant(product, item.variant);
            if (matchingSku) {
                price = matchingSku.price;
            }
        }
        
        calculatedItemsPrice += price * (Number(item.qty || item.quantity) || 0);
    }
    
    calculatedItemsPrice = Number(calculatedItemsPrice.toFixed(2));

    // 2. Shipping Charges
    let calculatedShippingPrice = 0;
    
    if (shippingAddress) {
        const minShippingAmount = Number.isFinite(Number(settings?.minShippingOrderAmount)) ? Number(settings.minShippingOrderAmount) : 0;
        const maxShippingAmount = Number.isFinite(Number(settings?.maxShippingOrderAmount)) ? Number(settings.maxShippingOrderAmount) : 499;
        const shippingCharge = Number.isFinite(Number(settings?.shippingCharge)) ? Number(settings.shippingCharge) : 40;
        
        const isInShippingRange = maxShippingAmount >= minShippingAmount
            && calculatedItemsPrice >= minShippingAmount
            && calculatedItemsPrice <= maxShippingAmount;
        
        calculatedShippingPrice = isInShippingRange ? shippingCharge : 0;
    }
    
    calculatedShippingPrice = Number(calculatedShippingPrice.toFixed(2));

    // 3. Discount (Coupon)
    let calculatedDiscount = 0;
    let appliedCoupon = null;

    if (coupon && coupon.code) {
        const couponRecord = await Coupon.findOne({
            code: String(coupon.code).trim().toUpperCase(),
            active: true,
            isOffer: false
        });

        if (couponRecord) {
            let isExpired = false;
            if (couponRecord.expiryDate) {
                const expiry = new Date(`${couponRecord.expiryDate}T23:59:59.999Z`);
                if (expiry.getTime() < Date.now()) {
                    isExpired = true;
                }
            }

            const minPurchase = Number(couponRecord.minPurchase) || 0;
            if (!isExpired && calculatedItemsPrice >= minPurchase) {
                if (couponRecord.type === 'percentage') {
                    const calculatedPercentageDiscount = (calculatedItemsPrice * Number(couponRecord.value)) / 100;
                    const maxDiscount = Number(couponRecord.maxDiscount) || Infinity;
                    calculatedDiscount = Math.min(calculatedPercentageDiscount, maxDiscount);
                } else if (couponRecord.type === 'flat') {
                    calculatedDiscount = Number(couponRecord.value) || 0;
                }
                // Never more than the goods themselves (a misconfigured flat
                // coupon used to make whole orders free).
                calculatedDiscount = Math.max(0, Math.min(calculatedDiscount, calculatedItemsPrice));
                calculatedDiscount = Number(calculatedDiscount.toFixed(2));

                appliedCoupon = {
                    code: couponRecord.code,
                    discount: calculatedDiscount,
                    type: couponRecord.type
                };
            }
        }
    }

    const calculatedTotalPrice = Math.max(0, calculatedItemsPrice + calculatedShippingPrice - calculatedDiscount);

    return {
        itemsPrice: calculatedItemsPrice,
        shippingPrice: calculatedShippingPrice,
        taxPrice: 0,
        totalPrice: Number(calculatedTotalPrice.toFixed(2)),
        discount: calculatedDiscount,
        coupon: appliedCoupon,
        settings,
        productsById,
        orderItems
    };
};
