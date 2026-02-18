import express from 'express';
const router = express.Router();
import {
    createBankOffer,
    getBankOffers,
    deleteBankOffer,
    updateBankOfferStatus,
    getBankOffersForProduct
} from '../controllers/bankOfferController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/')
    .post(protect, admin, createBankOffer)
    .get(protect, admin, getBankOffers); // Admin list

router.route('/product/:productId')
    .get(getBankOffersForProduct); // Public check

router.route('/:id')
    .delete(protect, admin, deleteBankOffer);

router.route('/:id/status')
    .put(protect, admin, updateBankOfferStatus);

export default router;
