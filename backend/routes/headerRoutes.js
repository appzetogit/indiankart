import express from 'express';
import { getHeaderConfig, updateHeaderConfig } from '../controllers/headerController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getHeaderConfig)
    .put(protect, admin, updateHeaderConfig);

export default router;
