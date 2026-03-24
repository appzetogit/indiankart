import express from 'express';
const router = express.Router();
import { 
    getCategories, 
    getCategoryById,
    createCategory, 
    updateCategory, 
    deleteCategory 
} from '../controllers/categoryController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

router.route('/')
    .get(getCategories)
    .post(
        protect,
        admin,
        upload.fields([
            { name: 'icon', maxCount: 1 },
            { name: 'bannerImage', maxCount: 1 },
            { name: 'smallBanners', maxCount: 20 },
            { name: 'secondaryBanners', maxCount: 30 }
        ]),
        createCategory
    );

router.route('/:id')
    .get(getCategoryById)
    .put(
        protect,
        admin,
        upload.fields([
            { name: 'icon', maxCount: 1 },
            { name: 'bannerImage', maxCount: 1 },
            { name: 'smallBanners', maxCount: 20 },
            { name: 'secondaryBanners', maxCount: 30 }
        ]),
        updateCategory
    )
    .delete(protect, admin, deleteCategory);

export default router;
