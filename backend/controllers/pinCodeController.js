import PinCode from '../models/PinCode.js';

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

        const XLSX = (await import('xlsx')).default || (await import('xlsx'));
        
        // Detect file type and parse accordingly
        const fileName = req.file.originalname || '';
        const isCSV = fileName.toLowerCase().endsWith('.csv');
        console.log('Processing file:', fileName, 'isCSV:', isCSV);
        
        let workbook;
        try {
            if (isCSV) {
                // Parse CSV file
                const csvContent = req.file.buffer.toString('utf-8');
                workbook = XLSX.read(csvContent, { type: 'string' });
            } else {
                // Parse Excel file
                workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            }
        } catch (parseError) {
            console.error('Parse error:', parseError);
            return res.status(400).json({ message: 'Failed to parse file', error: parseError.message });
        }
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Get raw data to see all values
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log('Raw data (first 5 rows):', rawData.slice(0, 5));
        
        // Parse with headers from first row
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (data.length === 0) {
            return res.status(400).json({ message: 'Excel file is empty' });
        }

        // Filter out completely empty rows
        const validRows = data.filter(row => {
            // Check if row has any non-empty values
            const hasData = Object.values(row).some(value => 
                value !== null && value !== undefined && String(value).trim() !== ''
            );
            return hasData;
        });

        // Helper function to find value from row by flexible column name matching
        const getValueFromRow = (row, possibleNames) => {
            // First try exact matches
            for (const name of possibleNames) {
                if (row[name]) return row[name];
            }
            
            // Then try case-insensitive and trimmed matches
            const rowKeys = Object.keys(row);
            for (const name of possibleNames) {
                const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
                const matchingKey = rowKeys.find(key => 
                    key.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedName
                );
                if (matchingKey && row[matchingKey]) return row[matchingKey];
            }
            return null;
        };

        console.log('Sample row:', validRows[0]); // Debug: see actual column names
        console.log('Total valid rows:', validRows.length);

        const results = {
            successful: 0,
            skipped: 0,
            errors: [],
            total: validRows.length,
            debug: {
                firstRowColumns: validRows.length > 0 ? Object.keys(validRows[0]) : [],
                sampleData: validRows.length > 0 ? validRows[0] : null
            }
        };

        for (let i = 0; i < validRows.length; i++) {
            const row = validRows[i];
            
            // Flexible column matching
            const pincode = getValueFromRow(row, ['Pincode', 'pincode', 'code', 'Code', 'PIN', 'pin']);
            const deliveryTime = getValueFromRow(row, ['DeliveryTime', 'deliveryTime', 'Delivery Time', 'DeliveryTim', 'DeliveryTin', 'delivery_time', 'Time']);
            const unit = getValueFromRow(row, ['Unit', 'unit', 'Units']) || 'days';
            const isCODVal = getValueFromRow(row, ['isCOD', 'COD', 'cod', 'CashOnDelivery']);
            const isCOD = isCODVal === 'false' || isCODVal === false || isCODVal === 'No' || isCODVal === 'no' ? false : true;

            // Validate row data
            if (!pincode || !deliveryTime) {
                results.errors.push(`Row ${i + 2}: Missing pincode or delivery time`);
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
                    deliveryTime: Number(deliveryTime),
                    unit: String(unit).toLowerCase(),
                    isCOD: isCOD
                });
                results.successful++;
            } catch (error) {
                results.errors.push(`Row ${i + 2}: ${error.message}`);
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
