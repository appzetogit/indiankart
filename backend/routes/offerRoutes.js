import express from 'express';
import {
    getOffers,
    getActiveOffers,
    getOfferById,
    createOffer,
    updateOffer,
    deleteOffer,
    toggleOfferStatus
} from '../controllers/offerController.js';
import { protect, admin, can } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getOffers);
router.get('/active', getActiveOffers);
router.get('/:id', getOfferById);

// Admin routes
router.post('/', protect, admin, can('coupons'), createOffer);
router.put('/:id', protect, admin, can('coupons'), updateOffer);
router.delete('/:id', protect, admin, can('coupons'), deleteOffer);
router.put('/:id/toggle', protect, admin, can('coupons'), toggleOfferStatus);

export default router;
