import mongoose from 'mongoose';

const paymentClaimSchema = new mongoose.Schema({
    paymentId: {
        type: String,
        required: true,
        trim: true
    },
    razorpayOrderId: {
        type: String,
        default: undefined,
        trim: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 7
    }
});

paymentClaimSchema.index({ paymentId: 1 }, { unique: true });
paymentClaimSchema.index(
    { razorpayOrderId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            razorpayOrderId: { $type: 'string', $exists: true }
        }
    }
);

const PaymentClaim = mongoose.model('PaymentClaim', paymentClaimSchema);

export default PaymentClaim;
