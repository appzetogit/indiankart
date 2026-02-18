import mongoose from 'mongoose';

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
        lowercase: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    businessAddress: {
        type: String,
        required: true
    },
    taxId: {
        type: String,
        required: true,
        trim: true
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
