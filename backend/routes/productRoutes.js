import express from 'express';
const router = express.Router();
import { 
    getProducts, 
    getProductById, 
    createProduct, 
    updateProduct, 
    deleteProduct,
    updateProductStock
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

import upload from '../config/cloudinary.js';

const uploadMiddleware = (req, res, next) => {
    upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images', maxCount: 10 }, { name: 'variant_images', maxCount: 20 }, { name: 'description_images', maxCount: 10 }])(req, res, (err) => {
        if (err) {
            console.error('Upload Middleware Error:', err);
            return res.status(400).json({ message: 'Image upload failed', error: err.message });
        }
        next();
    });
};

router.route('/')
    .get(getProducts)
    .post(protect, admin, uploadMiddleware, createProduct);
router.route('/:id')
    .get(getProductById)
    .put(protect, admin, uploadMiddleware, updateProduct)
    .delete(protect, admin, deleteProduct);

router.route('/:id/stock')
    .put(protect, admin, updateProductStock);

export default router;
