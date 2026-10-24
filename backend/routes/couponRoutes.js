import express from 'express';
const router = express.Router();
import { getCoupons, createCoupon, updateCouponStatus, updateCoupon, deleteCoupon } from '../controllers/couponController.js';
import { protect, admin, can } from '../middleware/authMiddleware.js';

router.route('/')
    .get(getCoupons) // Storefront gets active coupons only; admin panel (X-Admin-View) gets all
    .post(protect, admin, can('coupons'), createCoupon);

router.route('/:id')
    .put(protect, admin, can('coupons'), updateCouponStatus)
    .delete(protect, admin, can('coupons'), deleteCoupon);

router.route('/update/:id').put(protect, admin, can('coupons'), updateCoupon);

export default router;
