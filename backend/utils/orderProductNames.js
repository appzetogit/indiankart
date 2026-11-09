import fs from 'node:fs';
import path from 'node:path';
import Product from '../models/Product.js';
import { UPLOADS_ROOT, UPLOADS_URL_PREFIX } from './localStorage.js';

// Orders keep the name a product had when it was bought (orderItems.name).
// Everywhere orders are shown, the product's current name is used instead so a
// rename shows up in order history, admin lists, invoices and exports. The
// stored snapshot is left untouched and is the fallback for deleted products.

export const getProductNameMap = async (productIds = null) => {
    const filter = productIds ? { id: { $in: productIds } } : {};
    const products = await Product.find(filter).select('id name').lean();
    return new Map(products.map((product) => [Number(product.id), product.name]));
};

export const applyCurrentProductNamesSync = (orders = [], nameMap) => {
    for (const order of orders) {
        for (const item of order?.orderItems || []) {
            const currentName = nameMap.get(Number(item?.product));
            if (currentName) item.name = currentName;
        }
    }
    return orders;
};

// Orders also keep the image link a product had when it was bought. Files lost
// with the old server (and images later re-uploaded under new names) left those
// links pointing at nothing, so a missing local file is swapped for the
// product's current picture: the ordered variant's own picture when it has one.
const UPLOAD_MARKER = `${UPLOADS_URL_PREFIX}/`;
const fileExistsCache = new Map();

const isMissingLocalUpload = (url) => {
    if (typeof url !== 'string' || !url) return true;
    const at = url.indexOf(UPLOAD_MARKER);
    if (at === -1) return false; // not one of ours (external link): leave it
    const relative = decodeURIComponent(url.slice(at + UPLOAD_MARKER.length).split(/[?#]/)[0]);
    const target = path.join(UPLOADS_ROOT, relative);
    if (!target.startsWith(UPLOADS_ROOT)) return true;
    if (fileExistsCache.get(target) === true) return false; // files appear, they don't vanish
    const exists = fs.existsSync(target);
    if (exists) fileExistsCache.set(target, true);
    return !exists;
};

const trimText = (value) => String(value ?? '').trim();

const pickWorkingImage = (...candidates) =>
    candidates.find((url) => typeof url === 'string' && url && !isMissingLocalUpload(url)) || '';

const currentImageFor = (product, item) => {
    const variant = item?.variant && typeof item.variant === 'object' ? item.variant : {};
    const variantImages = [];
    for (const heading of product?.variantHeadings || []) {
        const chosen = Object.entries(variant).find(([key]) => trimText(key) === trimText(heading?.name))?.[1];
        if (chosen === undefined) continue;
        const option = (heading?.options || []).find((entry) => trimText(entry?.name) === trimText(chosen));
        if (option) variantImages.push(...(option.images || []), option.image);
    }
    return pickWorkingImage(...variantImages, product?.image, ...(product?.images || []));
};

// Mutates the orders in memory only; call right before sending them, never before a save.
export const applyCurrentProductNames = async (orders = []) => {
    const productIds = [...new Set(
        orders.flatMap((order) => (order?.orderItems || []).map((item) => Number(item?.product)))
            .filter(Number.isFinite)
    )];
    if (!productIds.length) return orders;
    const products = await Product.find({ id: { $in: productIds } })
        .select('id name image images variantHeadings')
        .lean();
    const byId = new Map(products.map((product) => [Number(product.id), product]));
    applyCurrentProductNamesSync(orders, new Map(products.map((product) => [Number(product.id), product.name])));
    for (const order of orders) {
        for (const item of order?.orderItems || []) {
            if (!isMissingLocalUpload(item?.image)) continue;
            const product = byId.get(Number(item?.product));
            const replacement = product && currentImageFor(product, item);
            if (replacement) item.image = replacement;
        }
    }
    return orders;
};

// Ids of products currently named like the search, so admin order search finds
// orders by a product's new name too.
export const findProductIdsByName = async (searchRegex) => {
    const products = await Product.find({ name: searchRegex }).select('id').limit(500).lean();
    return products.map((product) => Number(product.id));
};
