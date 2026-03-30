import mongoose from 'mongoose';

const returnSchema = mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Custom ID string e.g., 'RET123'
    orderId: { type: String, required: true },
    customer: { type: String, required: true },
    product: {
        id: { type: Number },
        name: { type: String, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        variant: { type: mongoose.Schema.Types.Mixed }
    },
    type: { 
        type: String, 
        required: true, 
        enum: ['Return', 'Replacement', 'Cancellation'] 
    },
    requestedQuantity: { type: Number, default: 1, min: 1 },
    reason: { type: String, required: true },
    comment: { type: String },
    googleDriveLink: { type: String },
    pickupAddress: {
        name: { type: String },
        phone: { type: String },
        address: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
        type: { type: String },
    },
    bankDetails: {
        accountHolderName: { type: String },
        accountNumber: { type: String },
        ifscCode: { type: String }
    },
    proofMedia: [{ type: String }],
    images: [{ type: String }],
    status: { 
        type: String, 
        required: true, 
        default: 'Pending',
        enum: ['Pending', 'Approved', 'Pickup Scheduled', 'Received at Warehouse', 'Refund Initiated', 'Replacement Dispatched', 'Completed', 'Rejected']
    },
    timeline: [{
        status: { type: String, required: true },
        time: { type: Date, default: Date.now },
        note: { type: String }
    }],
    date: { type: Date, default: Date.now }
}, {
    timestamps: true,
});

const Return = mongoose.model('Return', returnSchema);
export default Return;
