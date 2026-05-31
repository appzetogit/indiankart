import express from 'express';
import { authAdmin, logoutAdmin, getAdminProfile, updateAdminProfile, getDashboardSummary } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', authAdmin);
router.post('/logout', logoutAdmin);
router.route('/profile')
    .get(protect, admin, getAdminProfile)
    .put(protect, admin, updateAdminProfile);
router.get('/dashboard-summary', protect, admin, getDashboardSummary);

export default router;
