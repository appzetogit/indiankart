import mongoose from 'mongoose';

// The order a customer was about to place when a Razorpay order was opened for
// them. Saved server-side so that if the money is captured but the browser
// never gets as far as POST /orders (tab closed, network dropped, app killed
// during 3-D Secure), the webhook or the background reconciler can still
// create the order from it.
const pendingCheckoutSchema = new mongoose.Schema({
    razorpayOrderId: { type: String, required: true, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, required: true },
    // The same body the browser would send to POST /orders, minus paymentResult.
    orderPayload: { type: mongoose.Schema.Types.Mixed, required: true },
    // Amount the Razorpay order was opened for, in paise.
    amount: { type: Number, required: true },
    status: {
        type: String,
        // rejected: money arrived but does not match this order (amount,
        // checkout or already used). Held for an admin; never retried.
        enum: ['pending', 'completed', 'failed', 'abandoned', 'needs_review', 'rejected'],
        default: 'pending'
    },
    paymentId: { type: String, default: '' },
    capturedAt: { type: Date, default: null },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    // How the order came to exist: the customer's browser, or recovered here.
    completedBy: { type: String, enum: ['', 'browser', 'webhook', 'reconciler', 'callback'], default: '' },
    // Set when the customer paid in redirect mode: their page has navigated
    // away and will never call POST /orders, so there is nothing to wait for.
    browserGone: { type: Boolean, default: false },
    // Site the customer checked out on, to send them back to after paying.
    returnOrigin: { type: String, default: '' },
    attempts: { type: Number, default: 0 },
    createAttempts: { type: Number, default: 0 },
    lastError: { type: String, default: '' },
    rejectionCode: { type: String, default: '' },
    paidAmount: { type: Number },
    expectedAmount: { type: Number },
    lastCheckedAt: { type: Date, default: null },
    // Lease so two workers never build the same order at once.
    lockedUntil: { type: Date, default: null },
}, {
    timestamps: true,
});

pendingCheckoutSchema.index({ razorpayOrderId: 1 }, { unique: true });
pendingCheckoutSchema.index({ status: 1, createdAt: 1 });
// Finished records are only useful for a while; keep 30 days for support.
pendingCheckoutSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

const PendingCheckout = mongoose.model('PendingCheckout', pendingCheckoutSchema);

export default PendingCheckout;
