import mongoose from 'mongoose';

// A customer's cart, wishlist and saved-for-later list, kept on the server so
// they follow the account across devices. Only references are stored; product
// details and prices are read fresh from Product whenever the cart is loaded.
const lineSchema = new mongoose.Schema({
    productId: { type: Number, required: true },
    variant: { type: mongoose.Schema.Types.Mixed, default: {} },
    quantity: { type: Number, default: 1, min: 1 },
    // Image of the chosen variant at the time it was added.
    image: { type: String, default: '' },
    addedAt: { type: Date, default: Date.now },
}, { _id: false });

const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [lineSchema], default: [] },
    wishlist: { type: [lineSchema], default: [] },
    savedForLater: { type: [lineSchema], default: [] },
}, {
    timestamps: true,
});

cartSchema.index({ user: 1 }, { unique: true });

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
