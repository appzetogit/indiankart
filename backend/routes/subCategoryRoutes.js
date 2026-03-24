import express from 'express';
const router = express.Router();
import {
    getSubCategories,
    createSubCategory,
    deleteSubCategory,
    updateSubCategory,
    getSubCategoriesByCategory
} from '../controllers/subCategoryController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

router.route('/')
    .get(getSubCategories)
    .post(protect, admin, upload.single('image'), createSubCategory);

router.route('/category/:categoryId')
    .get(getSubCategoriesByCategory);

router.route('/:id')
    .put(protect, admin, upload.single('image'), updateSubCategory)
    .delete(protect, admin, deleteSubCategory);

export default router;
