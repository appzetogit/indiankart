import express from 'express';
const router = express.Router();
import { getReels, createReel, updateReel, deleteReel, likeReel } from '../controllers/reelController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

router.route('/')
    .get(getReels)
    .post(protect, admin, upload.single('video'), createReel);

router.route('/:id')
    .put(protect, admin, upload.single('video'), updateReel)
    .delete(protect, admin, deleteReel);

router.post('/:id/like', likeReel);

export default router;
