import express from 'express';
const router = express.Router();
import { deletePageByKey, getPages, getPageByKey, updatePageContent } from '../controllers/contentPageController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/')
    .get(getPages)
    .post(protect, admin, updatePageContent); // Upsert

router.route('/:key')
    .get(getPageByKey)
    .delete(protect, admin, deletePageByKey);

export default router;
