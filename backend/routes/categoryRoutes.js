import express from 'express';
const router = express.Router();
import { 
    getCategories, 
    createCategory, 
    updateCategory, 
    deleteCategory 
} from '../controllers/categoryController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

import upload from '../config/cloudinary.js';

router.route('/')
    .get(getCategories)
    .post(protect, admin, upload.fields([{ name: 'icon', maxCount: 1 }, { name: 'bannerImage', maxCount: 1 }]), createCategory);

router.route('/:id')
    .put(protect, admin, upload.fields([{ name: 'icon', maxCount: 1 }, { name: 'bannerImage', maxCount: 1 }]), updateCategory)
    .delete(protect, admin, deleteCategory);

export default router;
