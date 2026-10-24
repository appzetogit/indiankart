import express from 'express';
const router = express.Router();
import { 
    getProducts, 
    getProductById, 
    createProduct, 
    updateProduct, 
    deleteProduct,
    updateProductStock,
    incrementProductView,
    getProductViewInsights,
    getProductViewProducts,
    getPortalViewInsights,
    exportStockExcel,
    exportB2BExcel,
    exportProductTemplate,
    importProductsExcel,
    importB2BExcel,
    importStockExcel,
    setProductVisibility,
    getProductVisibilitySummary,
} from '../controllers/productController.js';
import { protect, admin, can } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const uploadMiddleware = (req, res, next) => {
    upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images', maxCount: 50 }, { name: 'variant_images', maxCount: 200 }, { name: 'description_images', maxCount: 50 }])(req, res, (err) => {
        if (err) {
            console.error('Upload Middleware Error:', err);
            return res.status(400).json({ message: 'Image upload failed', error: err.message });
        }
        next();
    });
};

router.route('/')
    .get(getProducts)
    .post(protect, admin, can('products'), uploadMiddleware, createProduct);

router.route('/visibility')
    .patch(protect, admin, can('productVisibility'), setProductVisibility);
router.route('/visibility/summary')
    .get(protect, admin, can('productVisibility'), getProductVisibilitySummary);
router.route('/bulk/template')
    .get(protect, admin, can('products'), exportProductTemplate);

router.route('/bulk/import')
    .post(protect, admin, can('products'), upload.single('file'), importProductsExcel);

router.route('/b2b/export')
    .get(protect, admin, can('b2b'), exportB2BExcel);

router.route('/b2b/import')
    .post(protect, admin, can('b2b'), upload.single('file'), importB2BExcel);

router.route('/stock/export')
    .get(protect, admin, can('stockManagement'), exportStockExcel);

router.route('/stock/import')
    .post(protect, admin, can('stockManagement'), upload.single('file'), importStockExcel);

router.route('/view-insights/products')
    .get(protect, admin, can('productViews', 'dashboard'), getProductViewProducts);

router.route('/view-insights/portal')
    .get(protect, admin, can('productViews', 'dashboard'), getPortalViewInsights);

router.route('/:id')

    .get(getProductById)
    .put(protect, admin, can('products', 'b2b'), uploadMiddleware, updateProduct)
    .delete(protect, admin, can('products'), deleteProduct);

router.route('/:id/stock')
    .put(protect, admin, can('products', 'stockManagement', 'maxSellingQty'), updateProductStock);

router.route('/:id/view-insights')
    .get(protect, admin, can('productViews'), getProductViewInsights);

router.route('/:id/view')
    .post(incrementProductView);

export default router;
