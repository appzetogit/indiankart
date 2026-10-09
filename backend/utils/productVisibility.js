// Single source of truth for hiding products from customers.
//
// A product is hidden when isVisible is explicitly false; documents created
// before the flag existed have no value and stay visible. Admin requests
// (req.isAdminViewer, set by detectAdminViewer) see everything.

export const VISIBLE_PRODUCT_FILTER = { isVisible: { $ne: false } };

export const HIDDEN_PRODUCT_MESSAGE = 'This product is currently unavailable';

export const isProductVisible = (product) => Boolean(product) && product.isVisible !== false;

// Adds the visibility rule to a Mongo filter unless an admin is looking.
export const withVisibility = (req, filter = {}) => {
    if (req?.isAdminViewer) return filter;
    if (!filter || Object.keys(filter).length === 0) return { ...VISIBLE_PRODUCT_FILTER };
    return { $and: [filter, VISIBLE_PRODUCT_FILTER] };
};

// For lists of already-loaded (e.g. populated) products.
export const visibleProducts = (req, products) => {
    if (req?.isAdminViewer) return products;
    return (products || []).filter(isProductVisible);
};

// Ids of hidden products, cached briefly: page-builder payloads need them on
// every request and the set changes rarely.
let hiddenIdsCache = { at: 0, ids: null };
const HIDDEN_IDS_TTL_MS = 15 * 1000;

export const getHiddenProductIds = async () => {
    if (hiddenIdsCache.ids && Date.now() - hiddenIdsCache.at < HIDDEN_IDS_TTL_MS) {
        return hiddenIdsCache.ids;
    }
    const { default: Product } = await import('../models/Product.js');
    const hidden = await Product.find({ isVisible: false }).select('id _id').lean();
    const ids = new Set();
    hidden.forEach((p) => {
        if (p.id !== undefined && p.id !== null) ids.add(String(p.id));
        ids.add(String(p._id));
    });
    hiddenIdsCache = { at: Date.now(), ids };
    return ids;
};

export const clearHiddenProductIdsCache = () => {
    hiddenIdsCache = { at: 0, ids: null };
};

// Page-builder data (category/subcategory pages) stores product items with a
// productSnapshot copy, and the storefront falls back to that copy. Walk any
// payload and drop product items whose product is hidden.
export const scrubHiddenProductItems = (value, hiddenIds) => {
    if (!hiddenIds || hiddenIds.size === 0 || value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) {
        return value
            .filter((entry) => !(entry && typeof entry === 'object'
                && entry.itemType === 'product'
                && entry.productId !== undefined
                && hiddenIds.has(String(entry.productId).trim())))
            .map((entry) => scrubHiddenProductItems(entry, hiddenIds));
    }
    if (value instanceof Date || value?._bsontype) return value;
    const result = {};
    for (const [key, child] of Object.entries(value)) {
        result[key] = scrubHiddenProductItems(child, hiddenIds);
    }
    return result;
};

// Convenience for controllers: scrub unless an admin is looking.
export const scrubForCustomer = async (req, value) => {
    if (req?.isAdminViewer) return value;
    return scrubHiddenProductItems(value, await getHiddenProductIds());
};
