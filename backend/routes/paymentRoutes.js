import express from 'express';
const router = express.Router();
import { createRazorpayOrder, verifyPayment, testRazorpayCredentials, getRazorpayConfig, getRazorpayStatus, handleRazorpayWebhook, handleRazorpayCallback, getCheckoutStatus } from '../controllers/paymentController.js';
import { protect, admin, can, requireSuperAdmin } from '../middleware/authMiddleware.js';

router.post('/webhook', handleRazorpayWebhook);
router.post('/callback', handleRazorpayCallback);
router.get('/callback', handleRazorpayCallback);
router.get('/checkout-status/:razorpayOrderId', protect, getCheckoutStatus);
router.post('/order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);
router.get('/status', getRazorpayStatus);
router.get('/config', protect, getRazorpayConfig);
router.get('/test-credentials', protect, admin, requireSuperAdmin, testRazorpayCredentials);

export default router;
