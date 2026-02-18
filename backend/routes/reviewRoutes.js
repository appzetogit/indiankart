import express from 'express';
const router = express.Router();
import {
    createReview,
    getProductReviews,
    getAllReviews,
    updateReviewStatus
} from '../controllers/reviewController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/')
    .post(protect, createReview)
    .get(protect, admin, getAllReviews);

router.route('/product/:productId')
    .get(getProductReviews);

router.route('/:id/status')
    .patch(protect, admin, updateReviewStatus);

export default router;
