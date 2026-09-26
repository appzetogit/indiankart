import mongoose from 'mongoose';
import StoreReview from '../models/StoreReview.js';

const STATUSES = ['pending', 'approved', 'rejected'];
const MAX_COMMENT = 1000;

// `protect` resolves either a customer (User) or an admin (Admin), and prefers
// the admin cookie. Only customers have a store-review slot, so an admin
// browsing the shop must never create, dismiss or be offered one.
const getCustomer = (req) => (req.user?.constructor?.modelName === 'User' ? req.user : null);

const isDuplicateKey = (error) => error?.code === 11000;

// @desc    Should this customer see the one-time store review popup?
// @route   GET /api/store-reviews/me/prompt
// @access  Private
export const getMyReviewPrompt = async (req, res) => {
    try {
        const customer = getCustomer(req);
        if (!customer) return res.json({ show: false });

        const alreadyHandled = await StoreReview.exists({ user: customer._id });
        return res.json({ show: !alreadyHandled });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Submit the customer's one store review
// @route   POST /api/store-reviews
// @access  Private
export const submitStoreReview = async (req, res) => {
    try {
        const customer = getCustomer(req);
        if (!customer) {
            return res.status(403).json({ message: 'Only customers can review the store' });
        }

        const rating = Number(req.body?.rating);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Please choose a rating from 1 to 5 stars' });
        }

        const comment = String(req.body?.comment ?? '').trim();
        if (comment.length > MAX_COMMENT) {
            return res.status(400).json({ message: `Please keep your comment under ${MAX_COMMENT} characters` });
        }

        const review = await StoreReview.create({
            user: customer._id,
            name: String(customer.name || '').trim(),
            phone: String(customer.phone || '').trim(),
            rating,
            comment
        });

        return res.status(201).json({ _id: review._id, rating: review.rating, comment: review.comment });
    } catch (error) {
        if (isDuplicateKey(error)) {
            return res.status(409).json({ message: 'You have already shared your feedback. Thank you!' });
        }
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Customer closed the popup without reviewing; never ask again
// @route   POST /api/store-reviews/dismiss
// @access  Private
export const dismissStoreReview = async (req, res) => {
    try {
        const customer = getCustomer(req);
        if (!customer) return res.json({ ok: true });

        await StoreReview.create({ user: customer._id, dismissed: true });
        return res.json({ ok: true });
    } catch (error) {
        // Already reviewed or already dismissed: the prompt is done either way.
        if (isDuplicateKey(error)) return res.json({ ok: true });
        return res.status(500).json({ message: error.message });
    }
};

// @desc    List store reviews with summary stats
// @route   GET /api/store-reviews?status=&rating=&page=&limit=
// @access  Private/Admin
export const getStoreReviews = async (req, res) => {
    try {
        const filter = { dismissed: false };
        const status = String(req.query.status || '').toLowerCase();
        if (STATUSES.includes(status)) filter.status = status;
        const rating = Number(req.query.rating);
        if (Number.isInteger(rating) && rating >= 1 && rating <= 5) filter.rating = rating;

        const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
        const page = Math.max(Number(req.query.page) || 1, 1);

        const [reviews, total, [summary], dismissedCount] = await Promise.all([
            StoreReview.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('user', 'name email phone')
                .lean(),
            StoreReview.countDocuments(filter),
            StoreReview.aggregate([
                { $match: { dismissed: false } },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        average: { $avg: '$rating' },
                        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                        r1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
                        r2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
                        r3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
                        r4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
                        r5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } }
                    }
                }
            ]),
            StoreReview.countDocuments({ dismissed: true })
        ]);

        return res.json({
            reviews,
            page,
            pages: Math.max(Math.ceil(total / limit), 1),
            total,
            stats: {
                count: summary?.count || 0,
                average: summary?.average ? Number(summary.average.toFixed(2)) : 0,
                pending: summary?.pending || 0,
                distribution: {
                    1: summary?.r1 || 0,
                    2: summary?.r2 || 0,
                    3: summary?.r3 || 0,
                    4: summary?.r4 || 0,
                    5: summary?.r5 || 0
                },
                // Customers who closed the popup without reviewing.
                dismissed: dismissedCount
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Approve / reject a store review
// @route   PATCH /api/store-reviews/:id/status
// @access  Private/Admin
export const updateStoreReviewStatus = async (req, res) => {
    try {
        const status = String(req.body?.status || '').toLowerCase();
        if (!STATUSES.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Review not found' });
        }

        const review = await StoreReview.findOneAndUpdate(
            { _id: req.params.id, dismissed: false },
            { $set: { status } },
            { new: true }
        ).lean();

        if (!review) return res.status(404).json({ message: 'Review not found' });
        return res.json(review);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
