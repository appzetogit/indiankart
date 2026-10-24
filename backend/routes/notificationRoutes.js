import express from 'express';
import { getNotifications, markAsRead, markAllAsRead, sendPushNotification, deleteNotification, deleteAllNotifications } from '../controllers/notificationController.js';
import { protect, admin, can } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, admin, can(), getNotifications).delete(protect, admin, can('adminNotifications'), deleteAllNotifications);
router.route('/read-all').put(protect, admin, can(), markAllAsRead);
router.route('/send').post(protect, admin, can('userNotifications'), sendPushNotification);
router.route('/:id/read').put(protect, admin, can(), markAsRead);
router.route('/:id').delete(protect, admin, can('adminNotifications'), deleteNotification);

export default router;
