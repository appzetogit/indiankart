import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { findMatchingSkuForVariant } from '../utils/priceCalculator.js';
import { VISIBLE_PRODUCT_FILTER } from '../utils/productVisibility.js';

const MAX_LINES = 100;
const LIST_KEYS = { cart: 'items', wishlist: 'wishlist', savedForLater: 'savedForLater' };
const PRODUCT_FIELDS = 'id name brand price originalPrice discount rating ratingCount image category categoryId stock maxOrderQuantity b2bEnabled skus subCategories';

const cleanVariant = (variant) => {
    if (!variant || typeof variant !== 'object' || Array.isArray(variant)) return {};
    const result = {};
    for (const [key, value] of Object.entries(variant).slice(0, 10)) {
        if (typeof value === 'string' || typeof value === 'number') {
            result[String(key).slice(0, 60)] = String(value).slice(0, 120);
        }
    }
    return result;
};

const lineKey = (line) => `${line.productId}|${JSON.stringify(line.variant || {})}`;

// Accepts what the browser holds (full product snapshots) and keeps only the
// reference: product id, variant, quantity, chosen image. Prices sent by the
// browser are ignored.
const sanitizeLines = (lines) => {
    const seen = new Set();
    const result = [];
    for (const raw of Array.isArray(lines) ? lines : []) {
        const productId = Number(raw?.productId ?? raw?.id);
        if (!Number.isFinite(productId)) continue;
        const line = {
            productId,
            variant: cleanVariant(raw?.variant),
            quantity: Math.min(100, Math.max(1, Math.floor(Number(raw?.quantity) || 1))),
            image: typeof raw?.image === 'string' && raw.image.length < 1000 ? raw.image : '',
            addedAt: raw?.addedAt ? new Date(raw.addedAt) : new Date(),
        };
        if (Number.isNaN(line.addedAt.getTime())) line.addedAt = new Date();
        const key = lineKey(line);
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(line);
        if (result.length >= MAX_LINES) break;
    }
    return result;
};

// Turns stored references back into what the storefront expects (the product
// with the variant's live price and stock). Hidden or deleted products drop out.
const hydrate = async (cart) => {
    const lists = {
        cart: cart?.items || [],
        wishlist: cart?.wishlist || [],
        savedForLater: cart?.savedForLater || [],
    };
    const ids = [...new Set(Object.values(lists).flat().map((line) => line.productId))];
    const products = ids.length
        ? await Product.find({ id: { $in: ids }, ...VISIBLE_PRODUCT_FILTER }).select(PRODUCT_FIELDS).lean()
        : [];
    const byId = new Map(products.map((product) => [Number(product.id), product]));

    const build = (line) => {
        const product = byId.get(Number(line.productId));
        if (!product) return null;
        const variant = line.variant || {};
        const sku = Object.keys(variant).length ? findMatchingSkuForVariant(product, variant) : null;
        const { skus, ...base } = product;
        return {
            ...base,
            skus,
            image: line.image || product.image,
            price: sku?.price ?? product.price,
            originalPrice: sku?.originalPrice ?? product.originalPrice ?? sku?.price ?? product.price,
            stock: sku ? Number(sku.stock) || 0 : Number(product.stock) || 0,
            variant,
            quantity: line.quantity,
            addedAt: line.addedAt,
        };
    };

    return {
        cart: lists.cart.map(build).filter(Boolean),
        wishlist: lists.wishlist.map(build).filter(Boolean),
        savedForLater: lists.savedForLater.map(build).filter(Boolean),
        updatedAt: cart?.updatedAt || null,
    };
};

// @desc    The signed-in customer's cart, wishlist and saved-for-later
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id }).lean();
        return res.json(await hydrate(cart));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Save the cart (any of cart / wishlist / savedForLater may be sent)
// @route   PUT /api/cart
// @access  Private
export const saveCart = async (req, res) => {
    try {
        const update = {};
        for (const [bodyKey, field] of Object.entries(LIST_KEYS)) {
            if (Array.isArray(req.body?.[bodyKey])) {
                update[field] = sanitizeLines(req.body[bodyKey]);
            }
        }
        if (!Object.keys(update).length) {
            return res.status(400).json({ message: 'Nothing to save' });
        }
        const cart = await Cart.findOneAndUpdate(
            { user: req.user._id },
            { $set: update, $setOnInsert: { user: req.user._id } },
            { new: true, upsert: true, lean: true }
        );
        return res.json(await hydrate(cart));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
