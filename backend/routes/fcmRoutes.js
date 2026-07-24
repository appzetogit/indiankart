import express from 'express';
import FcmToken from '../models/FcmToken.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const isDuplicateKeyError = (error) => error?.code === 11000;

// Save or update token
// POST /api/fcm/token
router.post('/token', protect, async (req, res) => {
    try {
        const { token, platform, deviceId } = req.body;
        // Owner comes from the session, never the body: a caller-supplied userId
        // let anyone point their device at another account's push stream.
        const userId = String(req.user._id);

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'token is required'
            });
        }

        const normalizedToken = String(token);
        const tokenDocument = {
            userId: String(userId),
            token: normalizedToken,
            platform: platform ? String(platform).toLowerCase() : null,
            deviceId: deviceId ? String(deviceId) : null,
            updatedAt: new Date()
        };

        try {
            await FcmToken.findOneAndUpdate(
                { token: normalizedToken },
                tokenDocument,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        } catch (error) {
            if (!isDuplicateKeyError(error)) {
                throw error;
            }

            await FcmToken.updateOne(
                { token: normalizedToken },
                { $set: tokenDocument }
            );
        }

        return res.json({ success: true, message: 'Token saved' });
    } catch (error) {
        console.error('Save FCM token error:', error);
        return res.status(500).json({ success: false, message: 'Failed to save token' });
    }
});

// Delete token (logout/uninstall)
// DELETE /api/fcm/token
router.delete('/token', protect, async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'token is required'
            });
        }

        await FcmToken.deleteOne({
            userId: String(req.user._id),
            token: String(token)
        });

        return res.json({ success: true, message: 'Token deleted' });
    } catch (error) {
        console.error('Delete FCM token error:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete token' });
    }
});

export default router;
