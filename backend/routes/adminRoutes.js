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
    deleteAdmin,
    verifyAdminLoginMfa,
    startAdminMfaSetup,
    enableAdminMfa,
    logoutAllAdminSessions
} from '../controllers/adminController.js';
import { protect, admin, requireSuperAdmin, can } from '../middleware/authMiddleware.js';

const 
router = express.Router();

router.post('/login', authAdmin);
router.post('/login/mfa', verifyAdminLoginMfa);
router.post('/logout', logoutAdmin);
router.post('/logout-all', protect, admin, can(), logoutAllAdminSessions);
router.post('/mfa/setup', protect, admin, can(), startAdminMfaSetup);
router.post('/mfa/enable', protect, admin, can(), enableAdminMfa);
router.route('/profile')
    .get(protect, admin, can(), getAdminProfile)
    .put(protect, admin, can(), updateAdminProfile);
router.get('/dashboard-summary', protect, admin, can('dashboard'), getDashboardSummary);
router.get('/sidebar-options', protect, admin, can(), getAdminSidebarOptions);
router.route('/manage-admins')
    .get(protect, admin, requireSuperAdmin, listAdmins)
    .post(protect, admin, requireSuperAdmin, createAdmin);
router.route('/manage-admins/:id')
    .put(protect, admin, requireSuperAdmin, updateAdminAccess)
    .delete(protect, admin, requireSuperAdmin, deleteAdmin);

export default router;
