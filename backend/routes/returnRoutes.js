import express from 'express';
const router = express.Router();
import { getReturns, updateReturnStatus, createReturnRequest, getUserReturnRequests } from '../controllers/returnController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/')
    .post(protect, createReturnRequest)
    .get(protect, admin, getReturns);

router.route('/my-returns').get(protect, getUserReturnRequests);

router.route('/:id')
    .put(protect, admin, updateReturnStatus);

export default router;
