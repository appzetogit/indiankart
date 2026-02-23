import express from 'express';
import FcmToken from '../models/FcmToken.js';

const router = express.Router();

// Save or update token
// POST /api/fcm/token
router.post('/token', async (req, res) => {
    try {
        const { userId, token, platform, deviceId } = req.body;

        if (!userId || !token) {
            return res.status(400).json({
                success: false,
                message: 'userId and token are required'
            });
        }

        await FcmToken.findOneAndUpdate(
            { userId: String(userId), token: String(token) },
            {
                userId: String(userId),
                token: String(token),
                platform: platform ? String(platform).toLowerCase() : null,
                deviceId: deviceId ? String(deviceId) : null,
                updatedAt: new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return res.json({ success: true, message: 'Token saved' });
    } catch (error) {
        console.error('Save FCM token error:', error);
        return res.status(500).json({ success: false, message: 'Failed to save token' });
    }
});

// Delete token (logout/uninstall)
// DELETE /api/fcm/token
router.delete('/token', async (req, res) => {
    try {
        const { userId, token } = req.body;

        if (!userId || !token) {
            return res.status(400).json({
                success: false,
                message: 'userId and token are required'
            });
        }

        await FcmToken.deleteOne({
            userId: String(userId),
            token: String(token)
        });

        return res.json({ success: true, message: 'Token deleted' });
    } catch (error) {
        console.error('Delete FCM token error:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete token' });
    }
});

export default router;
