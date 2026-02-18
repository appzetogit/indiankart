import mongoose from 'mongoose';

const otpSchema = mongoose.Schema({
    mobile: { type: String, required: true },
    otp: { type: String, required: true },
    userType: { 
        type: String, 
        required: true, 
        enum: ['Customer', 'Delivery', 'Admin'] 
    },
    expiresAt: { type: Date, required: true },
}, {
    timestamps: true,
});

// Index to automatically expire documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model('Otp', otpSchema);

export default Otp;
