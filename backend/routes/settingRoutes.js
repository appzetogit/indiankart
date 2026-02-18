import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../config/cloudinary.js';

const router = express.Router();

const uploadMiddleware = (req, res, next) => {
    upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'signature', maxCount: 1 }])(req, res, (err) => {
        if (err) {
            console.error('Settings Upload Error:', err);
            return res.status(400).json({ message: 'Settings upload failed', error: err.message });
        }
        next();
    });
};

router.route('/')
    .get(getSettings)
    .put(protect, admin, uploadMiddleware, updateSettings);

export default router;
