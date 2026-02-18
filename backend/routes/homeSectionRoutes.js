import express from 'express';
const router = express.Router();
import { getHomeSections, createHomeSection, updateHomeSection, deleteHomeSection } from '../controllers/homeSectionController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/')
    .get(getHomeSections)
    .post(protect, admin, createHomeSection);

router.route('/:id')
    .put(protect, admin, updateHomeSection)
    .delete(protect, admin, deleteHomeSection);

export default router;
