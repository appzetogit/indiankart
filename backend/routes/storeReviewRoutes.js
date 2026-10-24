import express from 'express';
import {
    getMyReviewPrompt,
    submitStoreReview,
    dismissStoreReview,
    getStoreReviews,
    updateStoreReviewStatus
} from '../controllers/storeReviewController.js';
import { protect, admin, can } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, submitStoreReview)
    .get(protect, admin, can('reviews'), getStoreReviews);

router.get('/me/prompt', protect, getMyReviewPrompt);
router.post('/dismiss', protect, dismissStoreReview);
router.patch('/:id/status', protect, admin, can('reviews'), updateStoreReviewStatus);

export default router;
