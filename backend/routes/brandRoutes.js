import express from 'express';
const router = express.Router();
import {
    getBrands,
    getBrandsBySubCategory,
    createBrand,
    updateBrand,
    deleteBrand
} from '../controllers/brandController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

router.route('/')
    .get(getBrands)
    .post(protect, admin, upload.single('image'), createBrand);

router.route('/subcategory/:subcategoryId')
    .get(getBrandsBySubCategory);

router.route('/:id')
    .put(protect, admin, upload.single('image'), updateBrand)
    .delete(protect, admin, deleteBrand);

export default router;
