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
    toggleUserStatus
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const normalizePlatform = (platform = 'web') => {
    const platformMap = {
        web: 'web',
        mobile: 'mobile',
        app: 'mobile',
        android: 'mobile',
        ios: 'mobile'
    };

    return platformMap[String(platform).toLowerCase()] || null;
};

const saveFcmToken = async (req, res, forcedPlatform = null) => {
    console.log('FCM Token endpoint hit:', {
        hasToken: !!req.body.fcmToken || !!req.body.fcmTokenWeb || !!req.body.fcmTokenMobile,
        headers: !!req.headers.authorization,
        platform: forcedPlatform || req.body.platform
    });

    const fcmToken = req.body.fcmToken || req.body.fcmTokenWeb || req.body.fcmTokenMobile;
    const normalizedPlatform = normalizePlatform(forcedPlatform || req.body.platform || 'web');

    if (!fcmToken) {
        return res.status(400).json({ message: 'FCM Token is required' });
    }

    if (!normalizedPlatform) {
        return res.status(400).json({ message: 'Platform must be one of: web, mobile, app, android, ios' });
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
            console.log('Decoded user ID:', userId);
        }
    } catch (err) {
        console.log('No valid auth token:', err.message);
    }

    if (userId) {
        // Try to save token for regular User first
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(userId);

        if (user) {
            if (normalizedPlatform === 'web') {
                user.fcmTokenWeb = fcmToken;
            } else {
                user.fcmTokenMobile = fcmToken;
            }

            // Backward compatibility for old code paths that still read fcmToken.
            user.fcmToken = fcmToken;
            await user.save();

            console.log('FCM Token saved for USER:', userId, normalizedPlatform);
            return res.json({
                message: 'FCM Token saved successfully',
                saved: true,
                userType: 'user',
                platform: normalizedPlatform
            });
        }

        // If not a regular user, try Admin
        const Admin = (await import('../models/Admin.js')).default;
        const adminUser = await Admin.findById(userId);

        if (adminUser) {
            // Admin model currently stores one token.
            adminUser.fcmToken = fcmToken;
            await adminUser.save();
            console.log('FCM Token saved for ADMIN:', userId);
            return res.json({ message: 'FCM Token saved successfully', saved: true, userType: 'admin' });
        }

        console.log('User/Admin not found for ID:', userId);
    }

    // User not authenticated, just acknowledge
    console.log('Token received but user not authenticated');
    return res.json({ message: 'FCM Token received. Will save when user logs in.', saved: false });
};

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

        const users = await User.find({
            $or: [
                { fcmTokenWeb: { $ne: null, $exists: true } },
                { fcmTokenMobile: { $ne: null, $exists: true } },
                { fcmToken: { $ne: null, $exists: true } }
            ]
        }).select('name email fcmToken fcmTokenWeb fcmTokenMobile');
        const admins = await Admin.find({ fcmToken: { $ne: null, $exists: true } }).select('name email fcmToken');

        res.json({
            totalUsers: users.length,
            totalAdmins: admins.length,
            users: users.map((u) => ({
                name: u.name,
                email: u.email,
                hasTokenWeb: !!u.fcmTokenWeb,
                hasTokenMobile: !!u.fcmTokenMobile,
                hasLegacyToken: !!u.fcmToken
            })),
            admins: admins.map((a) => ({ name: a.name, email: a.email, hasToken: !!a.fcmToken }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generic FCM route
router.post('/fcm-token', async (req, res) => saveFcmToken(req, res));

// Explicit platform routes for app clients
router.post('/fcm-token/web', async (req, res) => saveFcmToken(req, res, 'web'));
router.post('/fcm-token/mobile', async (req, res) => saveFcmToken(req, res, 'mobile'));
router.post('/fcm-token/app', async (req, res) => saveFcmToken(req, res, 'mobile'));

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

console.log('Auth routes registered: /test, /fcm-token, /fcm-token/web, /fcm-token/mobile, /profile');

// Admin Routes
router.route('/users')
    .get(protect, admin, getUsers);

router.route('/users/:id')
    .delete(protect, admin, deleteUser)
    .put(protect, admin, updateUser);

router.patch('/users/:id/toggle-status', protect, admin, toggleUserStatus);

export default router;
