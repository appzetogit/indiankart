import express from 'express';
const router = express.Router();
import { getBanners, createBanner, updateBanner, deleteBanner } from '../controllers/bannerController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

import upload from '../config/cloudinary.js';

router.route('/')
    .get(getBanners)
    .post(protect, admin, upload.fields([{ name: 'slide_images', maxCount: 20 }, { name: 'hero_image', maxCount: 1 }, { name: 'background_image', maxCount: 1 }]), createBanner);

router.route('/:id')
    .put(protect, admin, upload.fields([{ name: 'slide_images', maxCount: 20 }, { name: 'hero_image', maxCount: 1 }, { name: 'background_image', maxCount: 1 }]), updateBanner)
    .delete(protect, admin, deleteBanner);

export default router;
