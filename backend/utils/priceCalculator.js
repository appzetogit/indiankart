import Product from '../models/Product.js';
import Setting from '../models/Setting.js';
import Coupon from '../models/Coupon.js';

const normalizeVariantObject = (variant) => {
    if (!variant || typeof variant !== 'object' || Array.isArray(variant)) {
        return {};
    }
    return Object.entries(variant).reduce((acc, [key, value]) => {
        const normalizedKey = String(key || '').trim();
        const normalizedValue = String(value || '').trim();
        if (!normalizedKey || !normalizedValue) return acc;
        acc[normalizedKey] = normalizedValue;
        return acc;
    }, {});
};

const findMatchingSkuForVariant = (product, variant) => {
    const normalizedVariant = normalizeVariantObject(variant);
    const itemKeys = Object.keys(normalizedVariant);
    if (!itemKeys.length) return null;

    return (Array.isArray(product?.skus) ? product.skus : []).find((sku) => {
        const combinationSource = sku?.combination instanceof Map
            ? Object.fromEntries(sku.combination)
            : sku?.combination;
        const combination = normalizeVariantObject(combinationSource);
        const combinationKeys = Object.keys(combination);

        if (itemKeys.length !== combinationKeys.length) return false;
        return itemKeys.every((key) => String(normalizedVariant[key]) === String(combination[key]));
    }) || null;
};

export const calculateOrderPrices = async ({ orderItems, shippingAddress, coupon }) => {
    let calculatedItemsPrice = 0;
    
    // 1. Calculate base items price using DB prices
    for (const item of orderItems) {
        const product = await Product.findOne({ id: item.product || item._id });
        if (!product) {
            throw new Error(`Product not found: ${item.name}`);
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
    const settings = await Setting.findOne().lean();
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
                calculatedDiscount = Number(calculatedDiscount.toFixed(2));

                appliedCoupon = {
                    code: couponRecord.code,
                    discount: calculatedDiscount,
                    type: couponRecord.type
                };
            }
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
        coupon: appliedCoupon
    };
};
