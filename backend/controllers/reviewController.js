import Review from '../models/Review.js';
import Product from '../models/Product.js';

const syncProductRating = async (productObjectId) => {
    if (!productObjectId) return;

    const approvedReviews = await Review.find({
        product: productObjectId,
        status: 'approved'
    }).select('rating');

    const ratingCount = approvedReviews.length;
    const averageRating = ratingCount > 0
        ? Number((approvedReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / ratingCount).toFixed(1))
        : 5;

    await Product.findByIdAndUpdate(productObjectId, {
        rating: averageRating,
        ratingCount
    });
};

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;

        // Check if product exists - using the custom 'id' field as per Product schema
        const product = await Product.findOne({ id: productId });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const review = new Review({
            product: product._id, // Use the MongoDB _id for relationship
            user: req.user._id,
            name: req.user.name,
            rating: Number(rating),
            comment,
            status: 'pending' // Default status
        });

        const createdReview = await review.save();
        res.status(201).json(createdReview);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get approved reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
export const getProductReviews = async (req, res) => {
    try {
        const product = await Product.findOne({ id: req.params.productId });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const reviews = await Review.find({ 
            product: product._id, 
            status: 'approved' 
        }).sort({ createdAt: -1 });

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all reviews (Admin only)
// @route   GET /api/reviews
// @access  Private/Admin
export const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find({})
            .populate('product', 'name id image')
            .populate('user', 'name email')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update review status (Admin only)
// @route   PATCH /api/reviews/:id/status
// @access  Private/Admin
export const updateReviewStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const review = await Review.findById(req.params.id);

        if (review) {
            review.status = status;
            const updatedReview = await review.save();
            await syncProductRating(review.product);
            res.json(updatedReview);
        } else {
            res.status(404).json({ message: 'Review not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
