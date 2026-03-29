import Setting from '../models/Setting.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';

// @desc    Get settings
// @route   GET /api/settings
// @access  Private/Admin
const getSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            // Create default settings if not exists
            settings = await Setting.create({
                sellerName: 'My E-com Store',
                sellerAddress: '123 E-com St, Digital City',
                shippingCharge: 40,
                freeShippingThreshold: 500,
                minShippingOrderAmount: 0,
                maxShippingOrderAmount: 499,
                categoryPageCatalog: []
            });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
    try {
        const {
            sellerName,
            sellerAddress,
            gstNumber,
            panNumber,
            contactEmail,
            contactPhone,
            fssai,
            razorpayKeyId,
            razorpayKeySecret,
            shippingCharge,
            freeShippingThreshold,
            minShippingOrderAmount,
            maxShippingOrderAmount,
            categoryPageCatalog
        } = req.body;

        let settings = await Setting.findOne();

        // Handle uploaded files via Cloudinary
        let logoUrl = req.body.logoUrl;
        let signatureUrl = req.body.signatureUrl;

        if (req.files) {
            if (req.files.logo && req.files.logo[0]?.buffer) {
                const uploadedLogo = await uploadBufferToCloudinary(
                    req.files.logo[0].buffer,
                    { folder: 'ecom_uploads/settings' }
                );
                logoUrl = uploadedLogo.secure_url;
            }
            if (req.files.signature && req.files.signature[0]?.buffer) {
                const uploadedSignature = await uploadBufferToCloudinary(
                    req.files.signature[0].buffer,
                    { folder: 'ecom_uploads/settings' }
                );
                signatureUrl = uploadedSignature.secure_url;
            }
        }

        if (settings) {
            settings.sellerName = sellerName || settings.sellerName;
            settings.sellerAddress = sellerAddress || settings.sellerAddress;
            settings.gstNumber = gstNumber || settings.gstNumber;
            settings.panNumber = panNumber || settings.panNumber;
            settings.logoUrl = logoUrl || settings.logoUrl;
            settings.signatureUrl = signatureUrl || settings.signatureUrl;
            settings.contactEmail = contactEmail || settings.contactEmail;
            settings.contactPhone = contactPhone || settings.contactPhone;
            settings.fssai = fssai || settings.fssai;
            settings.razorpayKeyId = razorpayKeyId || settings.razorpayKeyId;
            if (typeof razorpayKeySecret === 'string' && razorpayKeySecret.trim()) {
                settings.razorpayKeySecret = razorpayKeySecret.trim();
            }
            if (shippingCharge !== undefined) {
                const parsed = Number(shippingCharge);
                if (Number.isFinite(parsed) && parsed >= 0) settings.shippingCharge = parsed;
            }
            if (freeShippingThreshold !== undefined) {
                const parsed = Number(freeShippingThreshold);
                if (Number.isFinite(parsed) && parsed >= 0) settings.freeShippingThreshold = parsed;
            }
            if (minShippingOrderAmount !== undefined) {
                const parsed = Number(minShippingOrderAmount);
                if (Number.isFinite(parsed) && parsed >= 0) settings.minShippingOrderAmount = parsed;
            }
            if (maxShippingOrderAmount !== undefined) {
                const parsed = Number(maxShippingOrderAmount);
                if (Number.isFinite(parsed) && parsed >= 0) settings.maxShippingOrderAmount = parsed;
            }
            if (categoryPageCatalog !== undefined) {
                const parsedCatalog = typeof categoryPageCatalog === 'string'
                    ? JSON.parse(categoryPageCatalog)
                    : categoryPageCatalog;
                if (Array.isArray(parsedCatalog)) {
                    settings.categoryPageCatalog = parsedCatalog;
                }
            }

            const updatedSettings = await settings.save();
            res.json(updatedSettings);
        } else {
            // Create new settings if not exists
            const newSettings = await Setting.create({
                sellerName,
                sellerAddress,
                gstNumber,
                panNumber,
                logoUrl,
                signatureUrl,
                contactEmail,
                contactPhone,
                fssai,
                razorpayKeyId: razorpayKeyId || '',
                razorpayKeySecret: (typeof razorpayKeySecret === 'string' ? razorpayKeySecret.trim() : '') || '',
                shippingCharge: Number.isFinite(Number(shippingCharge)) ? Number(shippingCharge) : 40,
                freeShippingThreshold: Number.isFinite(Number(freeShippingThreshold)) ? Number(freeShippingThreshold) : 500,
                minShippingOrderAmount: Number.isFinite(Number(minShippingOrderAmount)) ? Number(minShippingOrderAmount) : 0,
                maxShippingOrderAmount: Number.isFinite(Number(maxShippingOrderAmount)) ? Number(maxShippingOrderAmount) : 499,
                categoryPageCatalog: Array.isArray(categoryPageCatalog)
                    ? categoryPageCatalog
                    : (typeof categoryPageCatalog === 'string'
                        ? (JSON.parse(categoryPageCatalog) || [])
                        : [])
            });
            res.json(newSettings);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload category page builder image
// @route   POST /api/settings/category-page-image
// @access  Private/Admin
const uploadCategoryPageImage = async (req, res) => {
    try {
        if (!req.file?.buffer) {
            return res.status(400).json({ message: 'Image file is required' });
        }

        const uploaded = await uploadBufferToCloudinary(req.file.buffer, {
            folder: 'ecom_uploads/category-page'
        });

        return res.json({
            imageUrl: uploaded?.secure_url || ''
        });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Image upload failed' });
    }
};

export { getSettings, updateSettings, uploadCategoryPageImage };
