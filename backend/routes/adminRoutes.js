import express from 'express';
import { authAdmin, logoutAdmin, getAdminProfile, updateAdminProfile } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', authAdmin);
router.post('/logout', logoutAdmin);
router.route('/profile')
    .get(protect, admin, getAdminProfile)
    .put(protect, admin, updateAdminProfile);

export default router;
