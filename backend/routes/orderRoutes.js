import express from 'express';
const router = express.Router();
import { 
    addOrderItems, 
    getOrders,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    getOrderDelhiveryTracking,
    assignOrderFulfillment
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/')
    .post(protect, addOrderItems) // Protected for creating
    .get(protect, admin, getOrders); // Admin for listing all orders

router.route('/myorders').get(protect, getMyOrders); // User's own orders

router.route('/:id')
    .get(protect, getOrderById); // Get specific order

router.route('/:id/delhivery-tracking').get(protect, getOrderDelhiveryTracking);

router.route('/:id/fulfillment').put(protect, admin, assignOrderFulfillment);

router.route('/:id/status').put(protect, admin, updateOrderStatus);

export default router;
