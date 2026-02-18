import Notification from '../models/Notification.js';
import User from '../models/User.js';
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

    console.log('📢 Push notification request:', { title, message, type, targetAudience });

    try {
        // 1. Get target tokens from both Users and Admins
        let targetTokens = [];

        if (targetAudience === 'All Users') {
            // Get all user tokens
            const users = await User.find({ fcmToken: { $ne: null, $exists: true } }).select('fcmToken');
            const userTokens = users.map(u => u.fcmToken).filter(Boolean);

            // Also get admin tokens (admins are users too!)
            const Admin = (await import('../models/Admin.js')).default;
            const admins = await Admin.find({ fcmToken: { $ne: null, $exists: true } }).select('fcmToken');
            const adminTokens = admins.map(a => a.fcmToken).filter(Boolean);

            targetTokens = [...userTokens, ...adminTokens];
            console.log(`👥 Users: ${userTokens.length}, 👨‍💼 Admins: ${adminTokens.length}`);

        } else if (targetAudience === 'New Users') {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const users = await User.find({
                createdAt: { $gte: thirtyDaysAgo },
                fcmToken: { $ne: null, $exists: true }
            }).select('fcmToken');
            targetTokens = users.map(u => u.fcmToken).filter(Boolean);
        }

        console.log(`🎯 Total target tokens found: ${targetTokens.length}`);

        // 2. Send via Firebase if tokens exist
        let firebaseSent = false;
        if (targetTokens.length > 0 && firebaseAdmin) {
            console.log('🔥 Sending via Firebase...');

            // Use multicast for better reliability
            const messages = targetTokens.map(token => ({
                token: token,
                notification: {
                    title: title,
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
                console.log(`✅ Firebase sent: ${batchResponse.successCount} success, ${batchResponse.failureCount} failures`);

                if (batchResponse.failureCount > 0) {
                    batchResponse.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            console.error(`❌ Failed to send to token ${idx}:`, resp.error);
                        }
                    });
                }

                firebaseSent = batchResponse.successCount > 0;
            } catch (firebaseError) {
                console.error('🔥 Firebase send error:', firebaseError);
            }
        } else if (!firebaseAdmin) {
            console.warn('⚠️ Firebase Admin not initialized');
        } else {
            console.warn('⚠️ No FCM tokens available');
        }

        // 3. Store in history
        const notification = await Notification.create({
            title,
            message,
            type: 'general',
            status: firebaseSent ? 'sent' : 'pending',
            targetAudience
        });

        console.log('💾 Notification saved to DB:', notification._id);

        res.status(201).json({
            ...notification._doc,
            firebaseSent,
            tokensTargeted: targetTokens.length
        });
    } catch (error) {
        console.error('❌ Push notification error:', error);
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
