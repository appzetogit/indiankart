import PinCode from '../models/PinCode.js';
import ExcelJS from 'exceljs';
import { Readable } from 'stream';

// @desc    Add a new serviceable PIN code
// @route   POST /api/pincodes
// @access  Private/Admin
const addPinCode = async (req, res) => {
    const { code, isCOD, deliveryTime, deliveryUnit } = req.body;

    // Validate inputs
    if (!code) {
        return res.status(400).json({ message: 'Please provide pincode' });
    }

    const pinCodeExists = await PinCode.findOne({ code });

    if (pinCodeExists) {
        return res.status(400).json({ message: 'PIN Code already exists' });
    }

    const pinCode = await PinCode.create({
        code,
        isCOD: isCOD !== undefined ? isCOD : true,
        deliveryTime: Number(deliveryTime) > 0 ? Number(deliveryTime) : 3,
        deliveryUnit: ['minutes', 'hours', 'days'].includes(String(deliveryUnit || '').toLowerCase())
            ? String(deliveryUnit).toLowerCase()
            : 'days'
    });

    if (pinCode) {
        res.status(201).json(pinCode);
    } else {
        res.status(400).json({ message: 'Invalid data' });
    }
};

// @desc    Get all PIN codes
// @route   GET /api/pincodes
// @access  Private/Admin
const getPinCodes = async (req, res) => {
    const pinCodes = await PinCode.find({}).sort({ createdAt: -1 });
    res.json(pinCodes);
};

// @desc    Delete a PIN code
// @route   DELETE /api/pincodes/:id
// @access  Private/Admin
const deletePinCode = async (req, res) => {
    const pinCode = await PinCode.findById(req.params.id);

    if (pinCode) {
        await pinCode.deleteOne();
        res.json({ message: 'PIN Code removed' });
    } else {
        res.status(404).json({ message: 'PIN Code not found' });
    }
};

// @desc    Check PIN code availability
// @route   GET /api/pincodes/check/:code
// @access  Public
const checkPinCode = async (req, res) => {
    const { code } = req.params;
    try {
        const pinCode = await PinCode.findOne({ code: code.trim() });

        if (pinCode && pinCode.isActive) {
            res.json({
                isServiceable: true,
                isCOD: pinCode.isCOD,
                deliveryTime: pinCode.deliveryTime,
                deliveryUnit: pinCode.deliveryUnit,
                message: 'Deliverable to this location'
            });
        } else {
            res.json({
                isServiceable: false,
                message: 'Not deliverable to this location'
            });
        }
    } catch (error) {
        console.error(`Error checking pincode:`, error);
        res.status(500).json({ message: 'Error checking pincode' });
    }
};

// @desc    Update a PIN code
// @route   PUT /api/pincodes/:id
// @access  Private/Admin
const updatePinCode = async (req, res) => {
    const { code, isCOD, deliveryTime, deliveryUnit } = req.body;
    const pinCode = await PinCode.findById(req.params.id);

    if (pinCode) {
        pinCode.code = code || pinCode.code;
        if (isCOD !== undefined) pinCode.isCOD = isCOD;
        if (deliveryTime !== undefined && Number(deliveryTime) > 0) pinCode.deliveryTime = Number(deliveryTime);
        if (deliveryUnit !== undefined && ['minutes', 'hours', 'days'].includes(String(deliveryUnit).toLowerCase())) {
            pinCode.deliveryUnit = String(deliveryUnit).toLowerCase();
        }

        const updatedPinCode = await pinCode.save();
        res.json(updatedPinCode);
    } else {
        res.status(404).json({ message: 'PIN Code not found' });
    }
};

// @desc    Bulk import PIN codes from Excel
// @route   POST /api/pincodes/bulk-import
// @access  Private/Admin
const bulkImportPinCodes = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an Excel file' });
        }
        if (!req.file.buffer || req.file.buffer.length === 0) {
            return res.status(400).json({ message: 'Uploaded file is empty' });
        }

        const fileName = (req.file.originalname || '').toLowerCase();
        const isCSV = fileName.endsWith('.csv');
        const isXLSX = fileName.endsWith('.xlsx');
        const isXLS = fileName.endsWith('.xls');

        if (isXLS) {
            return res.status(400).json({
                message: 'The .xls format is not supported. Please upload .xlsx or .csv'
            });
        }

        if (!isCSV && !isXLSX) {
            return res.status(400).json({
                message: 'Unsupported file format. Please upload .xlsx or .csv'
            });
        }

        const workbook = new ExcelJS.Workbook();

        try {
            if (isCSV) {
                await workbook.csv.read(Readable.from(req.file.buffer));
            } else {
                await workbook.xlsx.load(req.file.buffer);
            }
        } catch (parseError) {
            console.error('Parse error:', parseError);
            return res.status(400).json({ message: 'Failed to parse file', error: parseError.message });
        }

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            return res.status(400).json({ message: 'No worksheet found in uploaded file' });
        }

        const headerRow = worksheet.getRow(1);
        const headers = (headerRow.values || [])
            .slice(1)
            .map((h) => String(h || '').trim());

        if (headers.length === 0 || headers.every(h => !h)) {
            return res.status(400).json({ message: 'Header row is missing in uploaded file' });
        }

        const dataRows = [];
        for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
            const row = worksheet.getRow(rowIndex);
            const values = (row.values || []).slice(1);

            const rowObj = {};
            headers.forEach((header, idx) => {
                if (header) rowObj[header] = values[idx];
            });

            const hasData = Object.values(rowObj).some(value =>
                value !== null && value !== undefined && String(value).trim() !== ''
            );
            if (hasData) dataRows.push({ rowNumber: rowIndex, row: rowObj });
        }

        if (dataRows.length === 0) {
            return res.status(400).json({ message: 'Excel/CSV file has no data rows' });
        }

        const normalize = (value = '') => String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
        const getValueFromRow = (row, possibleNames) => {
            const normalizedNameSet = new Set(possibleNames.map(normalize));
            for (const [key, val] of Object.entries(row)) {
                if (normalizedNameSet.has(normalize(key)) && val !== undefined && val !== null && String(val).trim() !== '') {
                    return val;
                }
            }
            return null;
        };

        const results = {
            successful: 0,
            skipped: 0,
            errors: [],
            total: dataRows.length
        };

        for (let i = 0; i < dataRows.length; i++) {
            const { rowNumber, row } = dataRows[i];

            // Flexible column matching
            const pincode = getValueFromRow(row, ['Pincode', 'pincode', 'code', 'Code', 'PIN', 'pin']);
            const isCODVal = getValueFromRow(row, ['isCOD', 'COD', 'cod', 'CashOnDelivery']);
            const deliveryTimeVal = getValueFromRow(row, ['deliveryTime', 'Delivery Time', 'ETA', 'Estimated Time']);
            const deliveryUnitVal = getValueFromRow(row, ['deliveryUnit', 'Delivery Unit', 'ETA Unit']);
            const isCOD = ['false', 'no', '0'].includes(String(isCODVal).toLowerCase()) ? false : true;
            const parsedDeliveryTime = Number(deliveryTimeVal);
            const normalizedDeliveryUnit = ['minutes', 'hours', 'days'].includes(String(deliveryUnitVal || '').toLowerCase())
                ? String(deliveryUnitVal).toLowerCase()
                : 'days';

            // Validate row data
            if (!pincode) {
                results.errors.push(`Row ${rowNumber}: Missing pincode`);
                continue;
            }

            // Check if pincode already exists
            const existing = await PinCode.findOne({ code: String(pincode).trim() });
            if (existing) {
                results.skipped++;
                continue;
            }

            try {
                await PinCode.create({
                    code: String(pincode).trim(),
                    isCOD: isCOD,
                    deliveryTime: Number.isFinite(parsedDeliveryTime) && parsedDeliveryTime > 0 ? parsedDeliveryTime : 3,
                    deliveryUnit: normalizedDeliveryUnit
                });
                results.successful++;
            } catch (error) {
                results.errors.push(`Row ${rowNumber}: ${error.message}`);
            }
        }

        res.json({
            message: 'Bulk import completed',
            results
        });
    } catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({ message: 'Error processing Excel file', error: error.message });
    }
};

export {
    addPinCode,
    getPinCodes,
    deletePinCode,
    checkPinCode,
    bulkImportPinCodes,
    updatePinCode
};
