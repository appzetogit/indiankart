import fs from 'node:fs';
import path from 'node:path';
import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import SubCategory from '../models/SubCategory.js';
import { UPLOADS_URL_PREFIX, ensureUploadsDir } from '../utils/localStorage.js';

// Thousands of uploaded files were lost with the old server, but the page-builder
// data still holds their links. Products, brands and sub-categories have since
// been given new photos, so when a stored image file is missing this swaps in
// the current photo of the same product (by id) or brand/sub-category (by name).
// The stored data is not changed here; the next builder save keeps the new links.

const CACHE_MS = 60 * 1000;
let lookupCache = null;
let lookupCachedAt = 0;
const existsCache = new Map();

const fileExists = (url) => {
    const relative = String(url || '').split(`${UPLOADS_URL_PREFIX}/`)[1];
    if (!relative) return true; // not a local upload
    const cached = existsCache.get(relative);
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.ok;
    let ok = true;
    try {
        const clean = decodeURIComponent(relative.split('?')[0]);
        ok = clean.includes('..') ? true : fs.existsSync(path.join(ensureUploadsDir(), clean));
    } catch {
        ok = true;
    }
    if (existsCache.size > 20000) existsCache.clear();
    existsCache.set(relative, { ok, at: Date.now() });
    return ok;
};

const loadLookups = async () => {
    if (lookupCache && Date.now() - lookupCachedAt < CACHE_MS) return lookupCache;
    const [products, brands, subCategories] = await Promise.all([
        Product.find({}).select('id image').lean(),
        Brand.find({}).select('name image').lean(),
        SubCategory.find({}).select('name image').lean()
    ]);
    const productImage = new Map();
    products.forEach((product) => {
        if (!product?.image || !fileExists(product.image)) return;
        productImage.set(String(product.id), product.image);
        productImage.set(String(product._id), product.image);
    });
    const nameImage = new Map();
    [...brands, ...subCategories].forEach((entry) => {
        const name = String(entry?.name || '').trim().toLowerCase();
        if (!name || !entry?.image || !fileExists(entry.image) || nameImage.has(name)) return;
        nameImage.set(name, entry.image);
    });
    lookupCache = { productImage, nameImage };
    lookupCachedAt = Date.now();
    return lookupCache;
};

const repairTree = (node, lookups, depth = 0) => {
    if (!node || depth > 14 || typeof node !== 'object') return node;
    if (Array.isArray(node)) {
        node.forEach((child) => repairTree(child, lookups, depth + 1));
        return node;
    }
    if (typeof node.image === 'string' && node.image && !fileExists(node.image)) {
        const byProduct = lookups.productImage.get(String(node.productId ?? node.id ?? ''));
        const byName = lookups.nameImage.get(String(node.name || node.title || '').trim().toLowerCase());
        const replacement = byProduct || byName;
        if (replacement) node.image = replacement;
    }
    Object.values(node).forEach((child) => {
        if (child && typeof child === 'object') repairTree(child, lookups, depth + 1);
    });
    return node;
};

export const repairLostImages = (req, res, next) => {
    if (req.method !== 'GET') return next();
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        if (!body || typeof body !== 'object' || res.statusCode >= 400) return originalJson(body);
        loadLookups()
            .then((lookups) => {
                // Work on a copy: bodies can be cached objects shared between requests.
                const copy = JSON.parse(JSON.stringify(body));
                originalJson(repairTree(copy, lookups));
            })
            .catch(() => originalJson(body));
        return res;
    };
    return next();
};
