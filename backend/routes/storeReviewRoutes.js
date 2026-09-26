import express from 'express';
import {
    getMyReviewPrompt,
    submitStoreReview,
    dismissStoreReview,
    getStoreReviews,
    updateStoreReviewStatus
} from '../controllers/storeReviewController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, submitStoreReview)
    .get(protect, admin, getStoreReviews);

router.get('/me/prompt', protect, getMyReviewPrompt);
router.post('/dismiss', protect, dismissStoreReview);
router.patch('/:id/status', protect, admin, updateStoreReviewStatus);

export default router;
