import Notification from '../models/Notification.js';
import User from '../models/User.js';
import FcmToken from '../models/FcmToken.js';
import firebaseAdmin from '../config/firebase.js';

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Private/Admin
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({}).sort({ createdAt: -1 }).limit(50);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private/Admin
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (notification) {
            notification.isRead = true;
            await notification.save();
            res.json(notification);
        } else {
            res.status(404).json({ message: 'Notification not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private/Admin
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ isRead: false }, { isRead: true });
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send push notification
// @route   POST /api/notifications/send
// @access  Private/Admin
export const sendPushNotification = async (req, res) => {
    const { title, message, type, targetAudience } = req.body;

    console.log('Push notification request:', { title, message, type, targetAudience });

    try {
        const invalidTokenCodes = new Set([
            'messaging/registration-token-not-registered',
            'messaging/invalid-registration-token'
        ]);

        const removeInvalidTokenEverywhere = async (token) => {
            if (!token) return;

            await FcmToken.deleteMany({ token });
            await User.updateMany(
                {
                    $or: [
                        { fcmToken: token },
                        { fcmTokenWeb: token },
                        { fcmTokenMobile: token }
                    ]
                },
                {
                    $unset: {
                        fcmToken: 1,
                        fcmTokenWeb: 1,
                        fcmTokenMobile: 1
                    }
                }
            );

            const Admin = (await import('../models/Admin.js')).default;
            await Admin.updateMany({ fcmToken: token }, { $unset: { fcmToken: 1 } });
        };

        // 1. Get target tokens from both Users and Admins
        let targetTokens = [];

        const tokenProjection = 'fcmToken fcmTokenWeb fcmTokenMobile';
        const hasAnyTokenQuery = {
            $or: [
                { fcmTokenWeb: { $ne: null, $exists: true } },
                { fcmTokenMobile: { $ne: null, $exists: true } },
                { fcmToken: { $ne: null, $exists: true } }
            ]
        };
        const flattenUserTokens = (users) =>
            users.flatMap((u) => [u.fcmTokenWeb, u.fcmTokenMobile, u.fcmToken]).filter(Boolean);
        const getFcmCollectionTokens = async (userIds = null) => {
            const query = userIds
                ? { userId: { $in: userIds.map((id) => String(id)) } }
                : {};
            const docs = await FcmToken.find(query).select('token');
            return docs.map((d) => d.token).filter(Boolean);
        };

        const normalizedAudience = (targetAudience || 'All Users').trim();

        if (normalizedAudience === 'All Users') {
            const users = await User.find(hasAnyTokenQuery).select(tokenProjection);
            const userTokens = flattenUserTokens(users);
            const collectionTokens = await getFcmCollectionTokens();

            const Admin = (await import('../models/Admin.js')).default;
            const admins = await Admin.find({ fcmToken: { $ne: null, $exists: true } }).select('fcmToken');
            const adminTokens = admins.map((a) => a.fcmToken).filter(Boolean);

            targetTokens = Array.from(new Set([...userTokens, ...collectionTokens, ...adminTokens]));
            console.log(
                `Users: ${userTokens.length}, Collection: ${collectionTokens.length}, Admins: ${adminTokens.length}`
            );
        } else if (normalizedAudience === 'New Users') {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const users = await User.find({
                createdAt: { $gte: thirtyDaysAgo }
            }).select(`${tokenProjection} _id`);
            const collectionTokens = await getFcmCollectionTokens(users.map((u) => u._id));
            targetTokens = Array.from(new Set([...flattenUserTokens(users), ...collectionTokens]));
        } else if (normalizedAudience === 'Active Users') {
            const users = await User.find({
                status: 'active'
            }).select(`${tokenProjection} _id`);
            const collectionTokens = await getFcmCollectionTokens(users.map((u) => u._id));
            targetTokens = Array.from(new Set([...flattenUserTokens(users), ...collectionTokens]));
        } else if (normalizedAudience === 'Inactive Users') {
            const users = await User.find({
                status: 'disabled'
            }).select(`${tokenProjection} _id`);
            const collectionTokens = await getFcmCollectionTokens(users.map((u) => u._id));
            targetTokens = Array.from(new Set([...flattenUserTokens(users), ...collectionTokens]));
        } else {
            const users = await User.find({}).select(`${tokenProjection} _id`);
            const collectionTokens = await getFcmCollectionTokens(users.map((u) => u._id));
            targetTokens = Array.from(new Set([...flattenUserTokens(users), ...collectionTokens]));
        }

        console.log(`Total target tokens found: ${targetTokens.length}`);

        // 2. Send via Firebase if tokens exist
        let firebaseSent = false;
        let successCount = 0;
        let failureCount = 0;
        const failureReasons = [];
        if (targetTokens.length > 0 && firebaseAdmin) {
            console.log('Sending via Firebase...');

            // Use per-token payloads for better failure visibility
            const messages = targetTokens.map((token) => ({
                token,
                notification: {
                    title,
                    body: message,
                },
                data: {
                    type: type || 'general',
                    click_action: '/',
                },
                webpush: {
                    notification: {
                        icon: '/indiankart-logo.png',
                        badge: '/indiankart-logo.png'
                    }
                }
            }));

            try {
                const batchResponse = await firebaseAdmin.messaging().sendEach(messages);
                console.log(`Firebase sent: ${batchResponse.successCount} success, ${batchResponse.failureCount} failures`);
                successCount = batchResponse.successCount;
                failureCount = batchResponse.failureCount;

                if (batchResponse.failureCount > 0) {
                    const cleanupTasks = [];
                    batchResponse.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            const code = resp.error?.code || 'unknown_error';
                            const errorMessage = resp.error?.message || 'Unknown Firebase error';
                            failureReasons.push({ token: targetTokens[idx], code, message: errorMessage });
                            console.error(`Failed to send to token ${idx}:`, resp.error);

                            if (invalidTokenCodes.has(code)) {
                                cleanupTasks.push(removeInvalidTokenEverywhere(targetTokens[idx]));
                            }
                        }
                    });
                    if (cleanupTasks.length > 0) {
                        await Promise.allSettled(cleanupTasks);
                    }
                }

                firebaseSent = batchResponse.successCount > 0;
            } catch (firebaseError) {
                console.error('Firebase send error:', firebaseError);
                failureReasons.push({
                    code: firebaseError?.code || 'firebase_send_error',
                    message: firebaseError?.message || 'Firebase send failed'
                });
            }
        } else if (!firebaseAdmin) {
            console.warn('Firebase Admin not initialized');
            failureReasons.push({
                code: 'firebase_not_initialized',
                message: 'Firebase Admin SDK is not initialized on backend'
            });
        } else {
            console.warn('No FCM tokens available');
            failureReasons.push({
                code: 'no_tokens',
                message: 'No FCM tokens found for selected audience'
            });
        }

        // 3. Store in history
        const typeToSchema = {
            order: 'order',
            order_update: 'order',
            return: 'return',
            returns: 'return',
            stock: 'stock',
            promotional: 'general',
            new_arrival: 'general',
            general: 'general'
        };
        const normalizedTypeKey = String(type || 'general').toLowerCase().replace(/\s+/g, '_');

        const notification = await Notification.create({
            title,
            message,
            type: typeToSchema[normalizedTypeKey] || 'general',
            status: firebaseSent ? 'sent' : (targetTokens.length > 0 ? 'failed' : 'pending'),
            targetAudience
        });

        console.log('Notification saved to DB:', notification._id);

        res.status(201).json({
            ...notification._doc,
            firebaseSent,
            tokensTargeted: targetTokens.length,
            firebaseSuccessCount: successCount,
            firebaseFailureCount: failureCount,
            failureReasons
        });
    } catch (error) {
        console.error('Push notification error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private/Admin
export const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (notification) {
            await notification.deleteOne();
            res.json({ message: 'Notification removed' });
        } else {
            res.status(404).json({ message: 'Notification not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
