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

router.route('/')
    .get(getSubCategories)
    .post(protect, admin, createSubCategory);

router.route('/category/:categoryId')
    .get(getSubCategoriesByCategory);

router.route('/:id')
    .put(protect, admin, updateSubCategory)
    .delete(protect, admin, deleteSubCategory);

export default router;
