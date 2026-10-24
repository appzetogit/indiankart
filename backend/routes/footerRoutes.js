import express from 'express';
import { getFooterConfig, updateFooterConfig } from '../controllers/footerController.js';
import { protect, admin, can } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getFooterConfig)
    .post(protect, admin, can('homepageFooter'), updateFooterConfig);

export default router;
