import mongoose from 'mongoose';

// A customer's review of their overall IndianKart experience, collected by the
// one-time popup on the home page. Separate from Review, which is per product.
//
// Exactly one document per customer, enforced by the unique index on `user`.
// Closing the popup without reviewing also writes a document (dismissed: true),
// so either outcome uses up the customer's single prompt - that is what makes
// it "once per account" on every device, and the database rejects a second
// one even if the API is called directly.
const storeReviewSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    // Snapshots, so the review still reads correctly if the account later
    // changes its details.
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    dismissed: { type: Boolean, default: false },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: function requiredUnlessDismissed() {
            return !this.dismissed;
        }
    },
    comment: { type: String, default: '', trim: true, maxlength: 1000 },
    // Reviews are admin-only for now. Pending by default so nothing counts as
    // approved until an admin says so, ready for a public testimonials section.
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

storeReviewSchema.index({ user: 1 }, { unique: true });
storeReviewSchema.index({ dismissed: 1, status: 1, createdAt: -1 });

const StoreReview = mongoose.model('StoreReview', storeReviewSchema);

export default StoreReview;
