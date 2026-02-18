import express from 'express';
const router = express.Router();
import { createRazorpayOrder, verifyPayment, testRazorpayCredentials } from '../controllers/paymentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.post('/order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);
router.get('/config', (req, res) => res.json({ keyId: process.env.RAZORPAY_KEY_ID }));
router.get('/test-credentials', protect, admin, testRazorpayCredentials);

export default router;
