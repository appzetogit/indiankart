import express from 'express';
const router = express.Router();
import { createRazorpayOrder, verifyPayment, testRazorpayCredentials, getRazorpayConfig } from '../controllers/paymentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.post('/order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);
router.get('/config', protect, getRazorpayConfig);
router.get('/test-credentials', protect, admin, testRazorpayCredentials);

export default router;
