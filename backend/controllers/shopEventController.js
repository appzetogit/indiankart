import mongoose from 'mongoose';
import ShopEvent, { SHOP_EVENT_RETENTION_DAYS } from '../models/ShopEvent.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { recordShopEvents, requestContext, isBotRequest, formatVariant, getDevice } from '../utils/shopEvents.js';
import { getClientIp } from '../utils/geoState.js';

// Actions the website may report. Views are recorded by the product view
// endpoint and orders by order creation, so neither can be sent from here.
const CLIENT_EVENT_TYPES = new Set(['add_to_cart', 'remove_from_cart', 'quantity_change', 'wishlist_add', 'buy_now', 'checkout_start']);
const FUNNEL_TYPES = ['view', 'add_to_cart', 'checkout_start', 'order'];
const ABANDONED_AFTER_MS = 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// --- abuse limits (per server process; good enough for one instance) ---
const RATE_LIMIT_PER_MINUTE = 120;
const DEDUPE_WINDOW_MS = 10 * 1000;
const rateBuckets = new Map();
const recentEvents = new Map();

const isRateLimited = (ip) => {
    const now = Date.now();
    const bucket = rateBuckets.get(ip);
    if (!bucket || now - bucket.start > 60 * 1000) {
        rateBuckets.set(ip, { start: now, count: 1 });
        if (rateBuckets.size > 50000) rateBuckets.clear();
        return false;
    }
    bucket.count += 1;
    return bucket.count > RATE_LIMIT_PER_MINUTE;
};

const isDuplicate = (key) => {
    const now = Date.now();
    const last = recentEvents.get(key);
    recentEvents.set(key, now);
    if (recentEvents.size > 50000) {
        for (const [entryKey, at] of recentEvents) {
            if (now - at > DEDUPE_WINDOW_MS) recentEvents.delete(entryKey);
        }
    }
    return Boolean(last && now - last < DEDUPE_WINDOW_MS);
};

// Product names/prices for validation, refreshed every 5 minutes.
let productCache = { at: 0, byId: new Map() };
const getProductLookup = async () => {
    if (Date.now() - productCache.at < 5 * 60 * 1000) return productCache.byId;
    const products = await Product.find({}).select('id name price image').lean();
    productCache = { at: Date.now(), byId: new Map(products.map((product) => [Number(product.id), product])) };
    return productCache.byId;
};

// @desc    Record a shopping action from the website
// @route   POST /api/shop-events
// @access  Public (optional login)
export const trackShopEvent = async (req, res) => {
    // Always answer quickly and the same way: tracking must never affect shopping.
    res.status(204).end();
    try {
        if (isBotRequest(req)) return;
        const ip = getClientIp(req) || 'unknown';
        if (isRateLimited(ip)) return;

        const type = String(req.body?.type || '');
        const productId = Number(req.body?.productId);
        if (!CLIENT_EVENT_TYPES.has(type) || !Number.isFinite(productId)) return;

        const product = (await getProductLookup()).get(productId);
        if (!product) return;

        const variant = formatVariant(req.body?.variant);
        const context = requestContext(req, req.body?.state);
        const dedupeKey = `${context.sessionId || ip}|${type}|${productId}|${variant}`;
        if (isDuplicate(dedupeKey)) return;

        const quantity = Math.min(100, Math.max(1, Math.round(Number(req.body?.quantity) || 1)));
        const price = Number(req.body?.price);
        recordShopEvents([{
            type,
            productId,
            productName: product.name,
            variant,
            quantity,
            price: Number.isFinite(price) && price > 0 && price < 10000000 ? price : Number(product.price) || 0,
            ...context
        }]);
    } catch (error) {
        console.warn('[shop-events] track failed:', error.message);
    }
};

// --- helpers for the admin views ---

const parseRange = (req) => {
    const now = new Date();
    const end = req.query.end ? new Date(req.query.end) : now;
    const start = req.query.start ? new Date(req.query.start) : new Date(now.getTime() - 29 * DAY_MS);
    const safeEnd = Number.isNaN(end.getTime()) ? now : end;
    const safeStart = Number.isNaN(start.getTime()) ? new Date(now.getTime() - 29 * DAY_MS) : start;
    if (!req.query.end || /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.end))) safeEnd.setHours(23, 59, 59, 999);
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(req.query.start || ''))) safeStart.setHours(0, 0, 0, 0);
    return { start: safeStart, end: safeEnd };
};

// "Ramesh Kumar" -> "Ramesh K."
const shortName = (name) => {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
};

const maskPhone = (phone) => {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length < 4) return '';
    return `${'•'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`.slice(-10);
};

const percent = (part, whole) => (whole > 0 ? Number(((part / whole) * 100).toFixed(1)) : 0);

// @desc    Shopping activity for the Product Views page
// @route   GET /api/shop-events/insights
// @access  Private/Admin (productViews)
export const getShopInsights = async (req, res) => {
    try {
        const { start, end } = parseRange(req);
        const match = { createdAt: { $gte: start, $lte: end } };

        const [byType, byProduct, recent] = await Promise.all([
            ShopEvent.aggregate([
                { $match: match },
                { $group: { _id: '$type', events: { $sum: 1 }, quantity: { $sum: '$quantity' }, sessions: { $addToSet: { $ifNull: ['$sessionId', ''] } } } },
                { $project: { events: 1, quantity: 1, visitors: { $size: '$sessions' } } }
            ]),
            ShopEvent.aggregate([
                { $match: match },
                { $group: { _id: { productId: '$productId', type: '$type' }, events: { $sum: 1 }, quantity: { $sum: '$quantity' }, value: { $sum: { $multiply: ['$price', '$quantity'] } } } }
            ]),
            ShopEvent.find({ ...match, type: { $ne: 'view' } })
                .sort({ createdAt: -1 })
                .limit(150)
                .populate('user', 'name')
                .lean()
        ]);

        const totals = Object.fromEntries(byType.map((entry) => [entry._id, { events: entry.events, quantity: entry.quantity, visitors: entry.visitors }]));
        const funnel = FUNNEL_TYPES.map((type, index) => {
            const count = totals[type]?.events || 0;
            const previous = index === 0 ? count : (totals[FUNNEL_TYPES[index - 1]]?.events || 0);
            return { type, count, fromPrevious: index === 0 ? 100 : percent(count, previous), fromViews: percent(count, totals.view?.events || 0) };
        });

        const products = await getProductLookup();
        const productRows = new Map();
        byProduct.forEach(({ _id, events, quantity, value }) => {
            const row = productRows.get(_id.productId) || {
                productId: _id.productId,
                name: products.get(Number(_id.productId))?.name || `Product ${_id.productId}`,
                image: products.get(Number(_id.productId))?.image || '',
                view: 0, add_to_cart: 0, remove_from_cart: 0, wishlist_add: 0, buy_now: 0, checkout_start: 0, order: 0, quantity_change: 0,
                orderedQuantity: 0, orderValue: 0
            };
            row[_id.type] = events;
            if (_id.type === 'order') {
                row.orderedQuantity = quantity;
                row.orderValue = value;
            }
            productRows.set(_id.productId, row);
        });
        const productTable = [...productRows.values()]
            .map((row) => ({
                ...row,
                cartRate: percent(row.add_to_cart, row.view),
                orderRate: percent(row.order, row.view),
                cartToOrder: percent(row.order, row.add_to_cart)
            }))
            .sort((a, b) => (b.view - a.view) || (b.add_to_cart - a.add_to_cart))
            .slice(0, 300);

        const activity = recent.map((event) => ({
            id: event._id,
            type: event.type,
            productId: event.productId,
            productName: event.productName,
            variant: event.variant,
            quantity: event.quantity,
            price: event.price,
            customer: event.user?.name ? shortName(event.user.name) : '',
            isGuest: !event.user,
            state: event.state,
            device: event.device,
            createdAt: event.createdAt
        }));

        res.json({
            range: { start, end },
            retentionDays: SHOP_EVENT_RETENTION_DAYS,
            trackingSince: (await ShopEvent.findOne({}).sort({ createdAt: 1 }).select('createdAt').lean())?.createdAt || null,
            totals,
            funnel,
            products: productTable,
            activity
        });
    } catch (error) {
        console.error('Shop insights error:', error);
        res.status(500).json({ message: 'Could not load shopping activity' });
    }
};

// @desc    Daily trend, states and variants for one product
// @route   GET /api/shop-events/product/:id
// @access  Private/Admin (productViews)
export const getProductShopActivity = async (req, res) => {
    try {
        const productId = Number(req.params.id);
        if (!Number.isFinite(productId)) return res.status(400).json({ message: 'Invalid product' });
        const { start, end } = parseRange(req);
        const match = { productId, createdAt: { $gte: start, $lte: end } };

        const [daily, states, variants, devices] = await Promise.all([
            ShopEvent.aggregate([
                { $match: match },
                { $group: { _id: { day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } }, type: '$type' }, count: { $sum: 1 } } }
            ]),
            ShopEvent.aggregate([
                { $match: { ...match, type: { $in: ['view', 'add_to_cart', 'order'] } } },
                { $group: { _id: { state: '$state', type: '$type' }, count: { $sum: 1 } } }
            ]),
            ShopEvent.aggregate([
                { $match: { ...match, type: { $in: ['add_to_cart', 'buy_now', 'order'] }, variant: { $ne: '' } } },
                { $group: { _id: { variant: '$variant', type: '$type' }, count: { $sum: 1 } } }
            ]),
            ShopEvent.aggregate([
                { $match: { ...match, type: 'view' } },
                { $group: { _id: '$device', count: { $sum: 1 } } }
            ])
        ]);

        const days = new Map();
        for (let at = new Date(start); at <= end; at = new Date(at.getTime() + DAY_MS)) {
            const key = at.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
            days.set(key, { date: key, view: 0, add_to_cart: 0, checkout_start: 0, order: 0 });
            if (days.size > 366) break;
        }
        daily.forEach(({ _id, count }) => {
            const row = days.get(_id.day);
            if (row && row[_id.type] !== undefined) row[_id.type] = count;
        });

        const pivot = (rows, key) => {
            const map = new Map();
            rows.forEach(({ _id, count }) => {
                const entry = map.get(_id[key]) || { [key]: _id[key], view: 0, add_to_cart: 0, buy_now: 0, order: 0 };
                entry[_id.type] = count;
                map.set(_id[key], entry);
            });
            return [...map.values()];
        };

        const product = (await getProductLookup()).get(productId);
        res.json({
            productId,
            name: product?.name || `Product ${productId}`,
            image: product?.image || '',
            daily: [...days.values()],
            states: pivot(states, 'state').sort((a, b) => b.view - a.view).slice(0, 15),
            variants: pivot(variants, 'variant').sort((a, b) => (b.add_to_cart + b.buy_now) - (a.add_to_cart + a.buy_now)).slice(0, 15),
            devices: devices.map(({ _id, count }) => ({ device: _id, count }))
        });
    } catch (error) {
        console.error('Product shop activity error:', error);
        res.status(500).json({ message: 'Could not load product activity' });
    }
};

// @desc    Logged-in customers whose cart has sat for 24h+ without an order
// @route   GET /api/shop-events/abandoned-carts
// @access  Private/Admin (productViews)
export const getAbandonedCarts = async (req, res) => {
    try {
        const cutoff = new Date(Date.now() - ABANDONED_AFTER_MS);
        const oldest = new Date(Date.now() - SHOP_EVENT_RETENTION_DAYS * DAY_MS);
        const carts = await Cart.find({
            'items.0': { $exists: true },
            updatedAt: { $lte: cutoff, $gte: oldest }
        }).select('user items updatedAt').sort({ updatedAt: -1 }).limit(500).lean();

        if (carts.length === 0) return res.json({ carts: [] });

        const userIds = carts.map((cart) => cart.user).filter(Boolean);
        const [users, recentOrders, products] = await Promise.all([
            User.find({ _id: { $in: userIds } }).select('name phone').lean(),
            Order.aggregate([
                { $match: { user: { $in: userIds } } },
                { $group: { _id: '$user', lastOrderAt: { $max: '$createdAt' } } }
            ]),
            getProductLookup()
        ]);
        const userById = new Map(users.map((user) => [String(user._id), user]));
        const lastOrderByUser = new Map(recentOrders.map((entry) => [String(entry._id), entry.lastOrderAt]));

        const result = carts.map((cart) => {
            const items = (cart.items || []).map((item) => {
                const product = products.get(Number(item.productId));
                return {
                    productId: item.productId,
                    name: product?.name || `Product ${item.productId}`,
                    image: item.image || product?.image || '',
                    variant: formatVariant(item.variant),
                    quantity: Number(item.quantity) || 1,
                    price: Number(product?.price) || 0,
                    addedAt: item.addedAt || null
                };
            });
            const firstAdded = items.reduce((min, item) => {
                const at = item.addedAt ? new Date(item.addedAt) : null;
                return at && (!min || at < min) ? at : min;
            }, null) || cart.updatedAt;
            const lastOrderAt = lastOrderByUser.get(String(cart.user));
            const user = userById.get(String(cart.user));
            return {
                userId: cart.user,
                customer: shortName(user?.name) || 'Customer',
                phone: maskPhone(user?.phone),
                hasPhone: Boolean(user?.phone),
                items,
                itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
                value: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
                firstAddedAt: firstAdded,
                lastActivityAt: cart.updatedAt,
                lastOrderAt: lastOrderAt || null,
                ordered: Boolean(lastOrderAt && new Date(lastOrderAt) > new Date(cart.updatedAt))
            };
        })
            .filter((cart) => !cart.ordered && cart.items.length > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 200);

        res.json({ carts: result, abandonedAfterHours: ABANDONED_AFTER_MS / (60 * 60 * 1000) });
    } catch (error) {
        console.error('Abandoned carts error:', error);
        res.status(500).json({ message: 'Could not load abandoned carts' });
    }
};

// @desc    Full phone number of one abandoned-cart customer, for a follow-up call
// @route   GET /api/shop-events/abandoned-carts/:userId/phone
// @access  Private/Admin (productViews)
export const revealAbandonedCartPhone = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
            return res.status(400).json({ message: 'Invalid customer' });
        }
        const cart = await Cart.findOne({ user: req.params.userId, 'items.0': { $exists: true } }).select('_id').lean();
        if (!cart) return res.status(404).json({ message: 'No cart for this customer' });
        const user = await User.findById(req.params.userId).select('phone').lean();
        if (!user?.phone) return res.status(404).json({ message: 'No phone number saved' });
        console.info(`[abandoned-cart] admin ${req.user?._id} revealed phone of customer ${req.params.userId}`);
        res.json({ phone: user.phone });
    } catch (error) {
        res.status(500).json({ message: 'Could not load phone number' });
    }
};

export const __testables = { shortName, maskPhone, parseRange, getDevice };
