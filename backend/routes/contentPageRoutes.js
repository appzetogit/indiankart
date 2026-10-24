import express from 'express';
const router = express.Router();
import { deletePageByKey, getPages, getPageByKey, updatePageContent } from '../controllers/contentPageController.js';
import { protect, admin, can } from '../middleware/authMiddleware.js';

router.route('/')
    .get(getPages)
    .post(protect, admin, can('staticPages', 'helpCenterContent'), updatePageContent); // Upsert

router.route('/:key')
    .get(getPageByKey)
    .delete(protect, admin, can('staticPages', 'helpCenterContent'), deletePageByKey);

export default router;
