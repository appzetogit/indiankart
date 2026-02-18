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
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getOffers);
router.get('/active', getActiveOffers);
router.get('/:id', getOfferById);

// Admin routes
router.post('/', protect, admin, createOffer);
router.put('/:id', protect, admin, updateOffer);
router.delete('/:id', protect, admin, deleteOffer);
router.put('/:id/toggle', protect, admin, toggleOfferStatus);

export default router;
