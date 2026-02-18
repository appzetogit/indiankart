import express from 'express';
const router = express.Router();
import {
    addPinCode,
    getPinCodes,
    deletePinCode,
    checkPinCode,
    bulkImportPinCodes,
    updatePinCode
} from '../controllers/pinCodeController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import multer from 'multer';

// Configure Multer for Excel file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv', // .csv
            'application/csv', // .csv alternative
            'text/plain' // .csv sometimes detected as text/plain
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel or CSV files are allowed'));
        }
    }
});

router.route('/').post(protect, admin, addPinCode).get(protect, admin, getPinCodes);
router.route('/bulk-import').post(protect, admin, upload.single('file'), bulkImportPinCodes);
router.route('/check/:code').get(checkPinCode);
router.route('/:id').delete(protect, admin, deletePinCode).put(protect, admin, updatePinCode);

export default router;
