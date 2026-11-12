import express from 'express';
import {
    trackShopEvent,
    getShopInsights,
    getProductShopActivity,
    getAbandonedCarts,
    revealAbandonedCartPhone
} from '../controllers/shopEventController.js';
import { protect, protectOptional, admin, can } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protectOptional, trackShopEvent);
router.get('/insights', protect, admin, can('productViews'), getShopInsights);
router.get('/product/:id', protect, admin, can('productViews'), getProductShopActivity);
router.get('/abandoned-carts', protect, admin, can('productViews'), getAbandonedCarts);
router.get('/abandoned-carts/:userId/phone', protect, admin, can('productViews'), revealAbandonedCartPhone);

export default router;
