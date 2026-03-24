import mongoose from 'mongoose';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phoneRegex = /^[6-9]\d{9}$/;
const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const sellerRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    storeName: {
        type: String,
        required: true,
        trim: true
    },
    businessEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [emailRegex, 'Please enter a valid business email address.']
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
        match: [phoneRegex, 'Please enter a valid 10-digit Indian mobile number.']
    },
    businessAddress: {
        type: String,
        required: true
    },
    taxId: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        match: [gstinRegex, 'Please enter a valid 15-character GSTIN / Tax ID.']
    },
    businessType: {
        type: String,
        required: true,
        enum: ['Individual', 'Partnership', 'Private Limited', 'Public Limited', 'Other']
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    adminNotes: {
        type: String
    }
}, {
    timestamps: true
});

const SellerRequest = mongoose.model('SellerRequest', sellerRequestSchema);

export default SellerRequest;
