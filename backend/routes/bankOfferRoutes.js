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
import { protect, admin, can } from '../middleware/authMiddleware.js';

router.route('/')
    .post(protect, admin, can('bankOffers'), createBankOffer)
    .get(protect, admin, can('bankOffers'), getBankOffers); // Admin list

router.route('/active')
    .get(getActiveBankOffers); // Public: active offers for checkout/product pages

router.route('/product/:productId')
    .get(getBankOffersForProduct); // Public check

router.route('/:id')
    .put(protect, admin, can('bankOffers'), updateBankOffer)
    .delete(protect, admin, can('bankOffers'), deleteBankOffer);

router.route('/:id/status')
    .put(protect, admin, can('bankOffers'), updateBankOfferStatus);

export default router;
