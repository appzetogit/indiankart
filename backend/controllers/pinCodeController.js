import PinCode from '../models/PinCode.js';
import ExcelJS from 'exceljs';
import { Readable } from 'stream';

// @desc    Add a new serviceable PIN code
// @route   POST /api/pincodes
// @access  Private/Admin
const addPinCode = async (req, res) => {
    const { code, deliveryTime, unit, isCOD } = req.body;

    // Validate inputs
    if (!code || !deliveryTime || !unit) {
        return res.status(400).json({ message: 'Please provide all fields' });
    }

    const pinCodeExists = await PinCode.findOne({ code });

    if (pinCodeExists) {
        return res.status(400).json({ message: 'PIN Code already exists' });
    }

    const pinCode = await PinCode.create({
        code,
        deliveryTime,
        unit,
        isCOD: isCOD !== undefined ? isCOD : true
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
                deliveryTime: pinCode.deliveryTime,
                unit: pinCode.unit,
                isCOD: pinCode.isCOD,
                message: `Delivered in ${pinCode.deliveryTime} ${pinCode.unit}`
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
    const { code, deliveryTime, unit, isCOD } = req.body;
    const pinCode = await PinCode.findById(req.params.id);

    if (pinCode) {
        pinCode.code = code || pinCode.code;
        pinCode.deliveryTime = deliveryTime || pinCode.deliveryTime;
        pinCode.unit = unit || pinCode.unit;
        if (isCOD !== undefined) pinCode.isCOD = isCOD;

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
            const deliveryTime = getValueFromRow(row, ['DeliveryTime', 'deliveryTime', 'Delivery Time', 'delivery_time', 'Time']);
            const unit = getValueFromRow(row, ['Unit', 'unit', 'Units']) || 'days';
            const isCODVal = getValueFromRow(row, ['isCOD', 'COD', 'cod', 'CashOnDelivery']);
            const isCOD = ['false', 'no', '0'].includes(String(isCODVal).toLowerCase()) ? false : true;

            // Validate row data
            if (!pincode || !deliveryTime) {
                results.errors.push(`Row ${rowNumber}: Missing pincode or delivery time`);
                continue;
            }

            const deliveryTimeNumber = Number(deliveryTime);
            if (!Number.isFinite(deliveryTimeNumber) || deliveryTimeNumber <= 0) {
                results.errors.push(`Row ${rowNumber}: Invalid delivery time`);
                continue;
            }

            const normalizedUnit = String(unit).toLowerCase();
            if (!['minutes', 'hours', 'days'].includes(normalizedUnit)) {
                results.errors.push(`Row ${rowNumber}: Unit must be minutes, hours, or days`);
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
                    deliveryTime: deliveryTimeNumber,
                    unit: normalizedUnit,
                    isCOD: isCOD
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
