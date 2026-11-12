import mongoose from 'mongoose';

// One shopping action by a visitor: viewed a product, added it to the cart,
// started checkout, ordered it, and so on. Powers the shopping activity
// sections of the admin Product Views page. Kept for 180 days.
export const SHOP_EVENT_TYPES = [
    'view',
    'add_to_cart',
    'remove_from_cart',
    'quantity_change',
    'wishlist_add',
    'buy_now',
    'checkout_start',
    'order'
];

export const SHOP_EVENT_RETENTION_DAYS = 180;

const shopEventSchema = new mongoose.Schema({
    type: { type: String, enum: SHOP_EVENT_TYPES, required: true },
    productId: { type: Number, required: true },
    productName: { type: String, default: '' },
    // Readable variant, e.g. "Cyber Green / 8GB / 128GB".
    variant: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    sessionId: { type: String, default: '' },
    state: { type: String, default: 'Unknown' },
    device: { type: String, enum: ['mobile', 'desktop', 'tablet', 'unknown'], default: 'unknown' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

shopEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: SHOP_EVENT_RETENTION_DAYS * 24 * 60 * 60 });
shopEventSchema.index({ productId: 1, createdAt: -1 });
shopEventSchema.index({ type: 1, createdAt: -1 });
shopEventSchema.index({ user: 1, createdAt: -1 });

const ShopEvent = mongoose.model('ShopEvent', shopEventSchema);

export default ShopEvent;
