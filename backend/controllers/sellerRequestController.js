import SellerRequest from '../models/SellerRequest.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const BUSINESS_TYPES = ['Individual', 'Partnership', 'Private Limited', 'Public Limited', 'Other'];

// @desc    Submit a seller request
// @route   POST /api/seller-requests
// @access  Private
export const submitSellerRequest = async (req, res) => {
    try {
        const {
            storeName,
            businessEmail,
            phoneNumber,
            businessAddress,
            taxId,
            businessType,
            description
        } = req.body;

        const normalizedEmail = String(businessEmail || '').trim().toLowerCase();
        const normalizedPhone = String(phoneNumber || '').replace(/\D/g, '');
        const normalizedTaxId = String(taxId || '').trim().toUpperCase();
        const normalizedBusinessType = String(businessType || '').trim();

        if (!EMAIL_REGEX.test(normalizedEmail)) {
            return res.status(400).json({ message: 'Please enter a valid business email address.' });
        }

        if (!PHONE_REGEX.test(normalizedPhone)) {
            return res.status(400).json({ message: 'Please enter a valid 10-digit Indian mobile number.' });
        }

        if (!GSTIN_REGEX.test(normalizedTaxId)) {
            return res.status(400).json({ message: 'Please enter a valid 15-character GSTIN / Tax ID.' });
        }

        if (!BUSINESS_TYPES.includes(normalizedBusinessType)) {
            return res.status(400).json({ message: 'Please select a valid business type.' });
        }

        // Check if user already has a pending or approved request
        const existingRequest = await SellerRequest.findOne({ userId: req.user._id });
        if (existingRequest) {
            return res.status(400).json({ message: 'You already have an active seller request.' });
        }

        const sellerRequest = await SellerRequest.create({
            userId: req.user._id,
            storeName,
            businessEmail: normalizedEmail,
            phoneNumber: normalizedPhone,
            businessAddress,
            taxId: normalizedTaxId,
            businessType: normalizedBusinessType,
            description
        });

        res.status(201).json(sellerRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all seller requests (Admin only)
// @route   GET /api/seller-requests
// @access  Private/Admin
export const getSellerRequests = async (req, res) => {
    try {
        const requests = await SellerRequest.find().populate('userId', 'name email');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update seller request status (Admin only)
// @route   PUT /api/seller-requests/:id
// @access  Private/Admin
export const updateSellerRequestStatus = async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const sellerRequest = await SellerRequest.findById(req.params.id);

        if (!sellerRequest) {
            return res.status(404).json({ message: 'Seller request not found.' });
        }

        sellerRequest.status = status;
        sellerRequest.adminNotes = adminNotes;

        await sellerRequest.save();

        res.json(sellerRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's seller request
// @route   GET /api/seller-requests/my-request
// @access  Private
export const getMySellerRequest = async (req, res) => {
    try {
        const request = await SellerRequest.findOne({ userId: req.user._id });
        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
