import express from 'express';
import { getHeaderConfig, updateHeaderConfig } from '../controllers/headerController.js';
import { protect, admin, can } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getHeaderConfig)
    .put(protect, admin, can('categoryPageBuilder', 'homepageFooter', 'storeSettings'), updateHeaderConfig);

export default router;
