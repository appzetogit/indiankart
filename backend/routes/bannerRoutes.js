import express from 'express';
const router = express.Router();
import { getBanners, createBanner, updateBanner, deleteBanner } from '../controllers/bannerController.js';
import { protect, admin, can } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

router.route('/')
    .get(getBanners)
    .post(
        protect,
        admin, can('categoryPageBuilder'),
        upload.fields([
            { name: 'slide_images', maxCount: 20 },
            { name: 'slide_mobile_images', maxCount: 20 },
            { name: 'hero_image', maxCount: 1 },
            { name: 'background_image', maxCount: 1 },
            { name: 'background_mobile_image', maxCount: 1 }
        ]),
        createBanner
    );

router.route('/:id')
    .put(
        protect,
        admin, can('categoryPageBuilder'),
        upload.fields([
            { name: 'slide_images', maxCount: 20 },
            { name: 'slide_mobile_images', maxCount: 20 },
            { name: 'hero_image', maxCount: 1 },
            { name: 'background_image', maxCount: 1 },
            { name: 'background_mobile_image', maxCount: 1 }
        ]),
        updateBanner
    )
    .delete(protect, admin, can('categoryPageBuilder'), deleteBanner);

export default router;
