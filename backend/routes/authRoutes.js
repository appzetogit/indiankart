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
    getUserAddresses,
    addUserAddress,
    updateUserAddress,
    deleteUserAddress
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const HARDCODED_BYPASS_USER_ID = '000000000000000000000001';

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
    try {
        console.log('FCM Token endpoint hit:', {
            userId: req.user?._id,
            hasToken: !!req.body.token || !!req.body.fcmToken || !!req.body.fcmTokenWeb || !!req.body.fcmTokenMobile,
            platform: forcedPlatform || req.body.platform
        });

        const fcmToken = req.body.token || req.body.fcmToken || req.body.fcmTokenWeb || req.body.fcmTokenMobile;
        const normalizedPlatform = normalizePlatform(forcedPlatform || req.body.platform || 'web');

        if (!fcmToken) {
            return res.status(400).json({ message: 'FCM Token is required' });
        }

        if (!normalizedPlatform) {
            return res.status(400).json({ message: 'Platform must be one of: web, mobile, app, android, ios' });
        }

        if (!req.user) {
            // This should ideally not happen if 'protect' middleware is used
            console.log('Token received but user not authenticated');
            return res.json({ message: 'FCM Token received but user not authenticated. Will save when user logs in.', saved: false });
        }

        const userId = req.user._id;

        if (String(userId) === HARDCODED_BYPASS_USER_ID) {
            return res.json({
                message: 'FCM Token received for bypass test user',
                saved: false,
                userType: 'user',
                platform: normalizedPlatform
            });
        }

        const FcmToken = (await import('../models/FcmToken.js')).default;
        const User = (await import('../models/User.js')).default;
        const Admin = (await import('../models/Admin.js')).default;

        // Determine if it's a regular user or admin
        const isUser = await User.exists({ _id: userId });
        const isAdmin = !isUser && await Admin.exists({ _id: userId });

        if (isUser) {
            const user = await User.findById(userId);
            if (normalizedPlatform === 'web') {
                user.fcmTokenWeb = fcmToken;
            } else {
                user.fcmTokenMobile = fcmToken;
            }
            user.fcmToken = fcmToken; // Backward compatibility
            await user.save();
            console.log('FCM Token saved for USER:', userId, normalizedPlatform);
        } else if (isAdmin) {
            const adminUser = await Admin.findById(userId);
            adminUser.fcmToken = fcmToken;
            await adminUser.save();
            console.log('FCM Token saved for ADMIN:', userId);
        } else {
            console.log('User/Admin not found for ID:', userId);
            return res.status(404).json({ message: 'User or Admin not found' });
        }

        // Always update the FcmToken collection
        await FcmToken.findOneAndUpdate(
            { userId: String(userId), token: fcmToken },
            {
                userId: String(userId),
                token: fcmToken,
                platform: normalizedPlatform,
                updatedAt: new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return res.json({
            message: 'FCM Token saved successfully',
            saved: true,
            userType: isUser ? 'user' : 'admin',
            platform: normalizedPlatform
        });

    } catch (error) {
        console.error('Error in saveFcmToken:', error);
        return res.status(500).json({ message: 'Internal Server Error while saving FCM token', error: error.message });
    }
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
router.post('/fcm-token', protect, async (req, res) => saveFcmToken(req, res));

// Explicit platform routes for app clients
router.post('/fcm-token/web', protect, async (req, res) => saveFcmToken(req, res, 'web'));
router.post('/fcm-token/mobile', protect, async (req, res) => saveFcmToken(req, res, 'mobile'));
router.post('/fcm-token/app', protect, async (req, res) => saveFcmToken(req, res, 'mobile'));

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.route('/profile/addresses')
    .get(protect, getUserAddresses)
    .post(protect, addUserAddress);

router.route('/profile/addresses/:addressId')
    .put(protect, updateUserAddress)
    .delete(protect, deleteUserAddress);

console.log('Auth routes registered: /test, /fcm-token, /fcm-token/web, /fcm-token/mobile, /profile');

// Admin Routes
router.route('/users')
    .get(protect, admin, getUsers);

router.route('/users/:id')
    .delete(protect, admin, deleteUser)
    .put(protect, admin, updateUser);

router.patch('/users/:id/toggle-status', protect, admin, toggleUserStatus);

export default router;
