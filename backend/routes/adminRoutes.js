import express from 'express';
import {
    authAdmin,
    logoutAdmin,
    getAdminProfile,
    updateAdminProfile,
    getDashboardSummary,
    getAdminSidebarOptions,
    listAdmins,
    createAdmin,
    updateAdminAccess,
    deleteAdmin
} from '../controllers/adminController.js';
import { protect, admin, requireSuperAdmin } from '../middleware/authMiddleware.js';

const 
router = express.Router();

router.post('/login', authAdmin);
router.post('/logout', logoutAdmin);
router.route('/profile')
    .get(protect, admin, getAdminProfile)
    .put(protect, admin, updateAdminProfile);
router.get('/dashboard-summary', protect, admin, getDashboardSummary);
router.get('/sidebar-options', protect, admin, getAdminSidebarOptions);
router.route('/manage-admins')
    .get(protect, admin, requireSuperAdmin, listAdmins)
    .post(protect, admin, requireSuperAdmin, createAdmin);
router.route('/manage-admins/:id')
    .put(protect, admin, requireSuperAdmin, updateAdminAccess)
    .delete(protect, admin, requireSuperAdmin, deleteAdmin);

export default router;
