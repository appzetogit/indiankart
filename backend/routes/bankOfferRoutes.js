import express from 'express';
const router = express.Router();
import {
    createBankOffer,
    updateBankOffer,
    getBankOffers,
    getActiveBankOffers,
    deleteBankOffer,
    updateBankOfferStatus,
    getBankOffersForProduct
} from '../controllers/bankOfferController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/')
    .post(protect, admin, createBankOffer)
    .get(protect, admin, getBankOffers); // Admin list

router.route('/active')
    .get(getActiveBankOffers); // Public: active offers for checkout/product pages

router.route('/product/:productId')
    .get(getBankOffersForProduct); // Public check

router.route('/:id')
    .put(protect, admin, updateBankOffer)
    .delete(protect, admin, deleteBankOffer);

router.route('/:id/status')
    .put(protect, admin, updateBankOfferStatus);

export default router;
