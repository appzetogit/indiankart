import express from 'express';
const router = express.Router();
import { getReturns, updateReturnStatus, createReturnRequest, getUserReturnRequests, assignReturnFulfillment } from '../controllers/returnController.js';
import { protect, admin, can } from '../middleware/authMiddleware.js';
import { returnProofUpload } from '../middleware/upload.js';

router.route('/')
    .post(
        protect,
        (req, res, next) => {
            returnProofUpload.array('proof_files', 6)(req, res, (err) => {
                if (err) {
                    return res.status(400).json({ message: err.message || 'Proof upload failed' });
                }
                return next();
            });
        },
        createReturnRequest
    )
    .get(protect, admin, can('returns', 'replacements', 'orders'), getReturns);

router.route('/my-returns').get(protect, getUserReturnRequests);

router.route("/:id/fulfillment")
    .put(protect, admin, can('returns', 'replacements', 'orders'), assignReturnFulfillment);

router.route("/:id")
    .put(protect, admin, can('returns', 'replacements', 'orders'), updateReturnStatus);

export default router;
