import express from 'express';
const router = express.Router();
import { getCoupons, createCoupon, updateCouponStatus, updateCoupon, deleteCoupon } from '../controllers/couponController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/')
    .get(getCoupons) // Publicly accessible
    .post(protect, admin, createCoupon);

router.route('/:id')
    .put(protect, admin, updateCouponStatus)
    .delete(protect, admin, deleteCoupon);

router.route('/update/:id').put(protect, admin, updateCoupon);

export default router;
