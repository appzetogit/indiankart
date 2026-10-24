import express from 'express';
const router = express.Router();
import { getHomeSections, createHomeSection, updateHomeSection, deleteHomeSection } from '../controllers/homeSectionController.js';
import { protect, admin, can } from '../middleware/authMiddleware.js';

router.route('/')
    .get(getHomeSections)
    .post(protect, admin, can('categoryPageBuilder'), createHomeSection);

router.route('/:id')
    .put(protect, admin, can('categoryPageBuilder'), updateHomeSection)
    .delete(protect, admin, can('categoryPageBuilder'), deleteHomeSection);

export default router;
