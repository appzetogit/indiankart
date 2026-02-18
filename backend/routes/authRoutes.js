import express from 'express';
const router = express.Router();
import {
    authUser,
    registerUser,
    sendLoginOtp,
    verifyLoginOtp,
    logoutUser,
    getUserProfile,
    getUsers,
    deleteUser,
    updateUser,
    updateUserProfile,
    toggleUserStatus,
    updateFcmToken
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/logout', logoutUser);
router.post('/send-otp', sendLoginOtp);
router.post('/verify-otp', verifyLoginOtp);

// Debug route to verify routes are working
router.get('/test', (req, res) => res.json({ message: 'Auth routes are working!' }));

// Debug route to check FCM tokens
router.get('/debug-tokens', async (req, res) => {
    try {
        const User = (await import('../models/User.js')).default;
        const Admin = (await import('../models/Admin.js')).default;

        const users = await User.find({ fcmToken: { $ne: null, $exists: true } }).select('name email fcmToken');
        const admins = await Admin.find({ fcmToken: { $ne: null, $exists: true } }).select('name email fcmToken');

        res.json({
            totalUsers: users.length,
            totalAdmins: admins.length,
            users: users.map(u => ({ name: u.name, email: u.email, hasToken: !!u.fcmToken })),
            admins: admins.map(a => ({ name: a.name, email: a.email, hasToken: !!a.fcmToken }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// FCM token route - accepts token and saves if user is authenticated
router.post('/fcm-token', async (req, res) => {
    console.log('📱 FCM Token endpoint hit:', { hasToken: !!req.body.fcmToken, headers: !!req.headers.authorization });
    const { fcmToken } = req.body;

    if (!fcmToken) {
        return res.status(400).json({ message: 'FCM Token is required' });
    }

    // Check if user is authenticated via header or cookie
    let userId = null;
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies.jwt) {
            token = req.cookies.jwt;
        }

        if (token) {
            const jwt = await import('jsonwebtoken');
            const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'secret');
            userId = decoded.id;
            console.log('🔑 Decoded user ID:', userId);
        }
    } catch (err) {
        console.log('⚠️ No valid auth token:', err.message);
    }

    if (userId) {
        // Try to save token for regular User first
        const User = (await import('../models/User.js')).default;
        let user = await User.findById(userId);

        if (user) {
            user.fcmToken = fcmToken;
            await user.save();
            console.log('✅ FCM Token saved for USER:', userId);
            return res.json({ message: 'FCM Token saved successfully', saved: true, userType: 'user' });
        }

        // If not a regular user, try Admin
        const Admin = (await import('../models/Admin.js')).default;
        let admin = await Admin.findById(userId);

        if (admin) {
            // Admin model might not have fcmToken field, add it dynamically
            admin.fcmToken = fcmToken;
            await admin.save();
            console.log('✅ FCM Token saved for ADMIN:', userId);
            return res.json({ message: 'FCM Token saved successfully', saved: true, userType: 'admin' });
        }

        console.log('❌ User/Admin not found for ID:', userId);
    }

    // User not authenticated, just acknowledge
    console.log('⚠️ Token received but user not authenticated');
    res.json({ message: 'FCM Token received. Will save when user logs in.', saved: false });
});

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

console.log('Auth routes registered: /test, /fcm-token, /profile');

// Admin Routes
router.route('/users')
    .get(protect, admin, getUsers);

router.route('/users/:id')
    .delete(protect, admin, deleteUser)
    .put(protect, admin, updateUser);

router.patch('/users/:id/toggle-status', protect, admin, toggleUserStatus);

export default router;
