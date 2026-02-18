import express from 'express';
import { getFooterConfig, updateFooterConfig } from '../controllers/footerController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getFooterConfig)
    .post(protect, admin, updateFooterConfig);

export default router;
