import express from 'express';
import { getNotifications, markAsRead, markAllAsRead, sendPushNotification, deleteNotification } from '../controllers/notificationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, admin, getNotifications);
router.route('/read-all').put(protect, admin, markAllAsRead);
router.route('/send').post(protect, admin, sendPushNotification);
router.route('/:id/read').put(protect, admin, markAsRead);
router.route('/:id').delete(protect, admin, deleteNotification);

export default router;
