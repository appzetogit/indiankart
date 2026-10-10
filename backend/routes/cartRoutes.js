import express from 'express';
import { getCart, saveCart } from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getCart)
    .put(protect, saveCart);

export default router;
