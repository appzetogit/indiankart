import express from 'express';
const router = express.Router();
import { getReels, createReel, updateReel, deleteReel } from '../controllers/reelController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

import upload from '../config/cloudinary.js';

router.route('/')
    .get(getReels)
    .post(protect, admin, upload.single('video'), createReel);

router.route('/:id')
    .put(protect, admin, upload.single('video'), updateReel)
    .delete(protect, admin, deleteReel);

export default router;
