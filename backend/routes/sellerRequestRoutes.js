import express from 'express';
import { 
    submitSellerRequest, 
    getSellerRequests, 
    updateSellerRequestStatus,
    getMySellerRequest 
} from '../controllers/sellerRequestController.js';
import { protect, admin, can } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, submitSellerRequest)
    .get(protect, admin, can('sellerRequests'), getSellerRequests);

router.get('/my-request', protect, getMySellerRequest);

router.route('/:id')
    .put(protect, admin, can('sellerRequests'), updateSellerRequestStatus);

export default router;
