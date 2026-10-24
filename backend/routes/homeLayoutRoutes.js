import express from 'express';
const router = express.Router();
import { getHomeLayout, updateHomeLayout } from '../controllers/homeLayoutController.js';
import { protect, admin, can } from '../middleware/authMiddleware.js';

router.route('/')
    .get(getHomeLayout)
    .put(protect, admin, can('categoryPageBuilder'), updateHomeLayout);

export default router;
