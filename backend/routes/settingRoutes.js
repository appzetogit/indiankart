import express from 'express';
import {
    getSettings,
    getCategoryPageConfig,
    getCategoryPageLayout,
    getCategoryPageSection,
    getSubCategoryPageConfig,
    getSubCategoryPageLayout,
    getSubCategoryPageSection,
    updateSettings,
    uploadCategoryPageImage
} from '../controllers/settingController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

const uploadMiddleware = (req, res, next) => {
    upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'signature', maxCount: 1 }])(req, res, (err) => {
        if (err) {
            console.error('Settings Upload Error:', err);
            return res.status(400).json({ message: 'Settings upload failed', error: err.message });
        }
        next();
    });
};

router.route('/')
    .get(getSettings)
    .put(protect, admin, uploadMiddleware, updateSettings);

router.get('/category-page-config/:categoryName', getCategoryPageConfig);
router.get('/category-page-layout/:categoryName', getCategoryPageLayout);
router.get('/category-page-section/:categoryName/:sectionId', getCategoryPageSection);
router.get('/subcategory-page-config/:categoryName/:subCategoryName', getSubCategoryPageConfig);
router.get('/subcategory-page-layout/:categoryName/:subCategoryName', getSubCategoryPageLayout);
router.get('/subcategory-page-section/:categoryName/:subCategoryName/:sectionId', getSubCategoryPageSection);

router.post('/category-page-image', protect, admin, upload.single('image'), uploadCategoryPageImage);

export default router;
