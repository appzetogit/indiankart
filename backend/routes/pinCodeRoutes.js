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
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const fileName = (file.originalname || '').toLowerCase();
        const hasAllowedExtension = fileName.endsWith('.xlsx') || fileName.endsWith('.csv');
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'text/csv', // .csv
            'application/csv', // .csv alternative
            'text/plain', // .csv sometimes detected as text/plain
            'application/octet-stream'
        ];
        if (hasAllowedExtension || allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only .xlsx or .csv files are allowed'));
        }
    }
});

router.route('/').post(protect, admin, addPinCode).get(protect, admin, getPinCodes);
router.route('/bulk-import').post(
    protect,
    admin,
    (req, res, next) => {
        upload.single('file')(req, res, (err) => {
            if (!err) return next();

            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ message: 'File is too large. Maximum size is 5MB' });
                }
                return res.status(400).json({ message: `Upload error: ${err.message}` });
            }

            return res.status(400).json({ message: err.message || 'Invalid upload request' });
        });
    },
    bulkImportPinCodes
);
router.route('/check/:code').get(checkPinCode);
router.route('/:id').delete(protect, admin, deletePinCode).put(protect, admin, updatePinCode);

export default router;
