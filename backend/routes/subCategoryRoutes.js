import express from 'express';
const router = express.Router();
import {
    getSubCategories,
    createSubCategory,
    deleteSubCategory,
    updateSubCategory,
    getSubCategoriesByCategory
} from '../controllers/subCategoryController.js';
import { protect, admin, can } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

router.route('/')
    .get(getSubCategories)
    .post(protect, admin, can('subcategories'), upload.single('image'), createSubCategory);

router.route('/category/:categoryId')
    .get(getSubCategoriesByCategory);

router.route('/:id')
    .put(protect, admin, can('subcategories'), upload.single('image'), updateSubCategory)
    .delete(protect, admin, can('subcategories'), deleteSubCategory);

export default router;
