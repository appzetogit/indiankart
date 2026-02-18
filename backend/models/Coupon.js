import mongoose from 'mongoose';

const couponSchema = mongoose.Schema({
    // Shared fields
    type: { type: String, required: true }, // 'percentage', 'flat' OR 'Bank Offer', 'Partner Offer' etc.
    title: { type: String, required: true },
    description: { type: String },
    active: { type: Boolean, default: true },
    isOffer: { type: Boolean, default: false }, // Distinguish between Coupon and Offer

    // Coupon specific
    code: { type: String }, // Unique index handled conditionally if needed, but simple string is fine for now
    value: { type: Number },
    minPurchase: { type: Number },
    maxDiscount: { type: Number },
    expiryDate: { type: String }, // Storing as string YYYY-MM-DD from frontend form
    userSegment: { type: String, default: 'all' },
    applicableCategory: { type: String, default: 'all' },
    usageCount: { type: Number, default: 0 },

    // Offer specific
    terms: { type: String }
}, {
    timestamps: true,
});

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
