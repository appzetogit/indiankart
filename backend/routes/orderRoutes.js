import express from 'express';
const router = express.Router();
import { 
    addOrderItems, 
    exportOrdersCsv,
    getOrders,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    getOrderDelhiveryTracking,
    getOrderShippingTracking,
    assignOrderFulfillment,
    updateBulkOrderStatus,
    getNewOrderCount,
    markOrdersSeen
} from '../controllers/orderController.js';
import { protect, admin, can } from '../middleware/authMiddleware.js';

router.route('/')
    .post(protect, addOrderItems) // Protected for creating
    .get(protect, admin, can('orders', 'deliverySlip', 'dashboard', 'users', 'returns', 'replacements'), getOrders); // Admin for listing all orders

router.route('/export').get(protect, admin, can('orders'), exportOrdersCsv);

// Must stay above '/:id' so these are not read as an order id.
router.route('/new-count').get(protect, admin, can(), getNewOrderCount);
router.route('/mark-seen').put(protect, admin, can(), markOrdersSeen);

router.route('/myorders').get(protect, getMyOrders); // User's own orders

router.route('/bulk-status').put(protect, admin, can('orders', 'deliverySlip'), updateBulkOrderStatus);

router.route('/:id')
    .get(protect, getOrderById); // Get specific order

router.route('/:id/delhivery-tracking').get(protect, getOrderDelhiveryTracking);
router.route('/:id/shipping-tracking').get(protect, getOrderShippingTracking);

router.route('/:id/fulfillment').put(protect, admin, can('orders', 'deliverySlip'), assignOrderFulfillment);

router.route('/:id/status').put(protect, admin, can('orders', 'deliverySlip'), updateOrderStatus);

export default router;
