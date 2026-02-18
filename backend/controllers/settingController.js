import Setting from '../models/Setting.js';

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
            fssai
        } = req.body;

        let settings = await Setting.findOne();

        // Handle uploaded files from Cloudinary
        let logoUrl = req.body.logoUrl;
        let signatureUrl = req.body.signatureUrl;

        if (req.files) {
            if (req.files.logo && req.files.logo[0]) {
                logoUrl = req.files.logo[0].path;
            }
            if (req.files.signature && req.files.signature[0]) {
                signatureUrl = req.files.signature[0].path;
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
                fssai
            });
            res.json(newSettings);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getSettings, updateSettings };
