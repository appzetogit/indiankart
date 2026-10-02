import mongoose from 'mongoose';

const otpSchema = mongoose.Schema({
    mobile: { type: String, required: true },
    otp: { type: String, required: true },
    userType: {
        type: String,
        required: true,
        enum: ['Customer', 'Delivery', 'Admin']
    },
    // When the code stops being accepted. Kept separate from expiresAt (when the
    // document is deleted) so an expired or already-used code can still be
    // recognised for a while and the customer told which it was, rather than
    // every failure looking like "wrong OTP". Older records lack it and fall back
    // to expiresAt.
    validUntil: { type: Date },
    // Set when the code is accepted. Marking instead of deleting lets a second
    // submission of the same code be identified as already used.
    usedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
}, {
    timestamps: true,
});

// Index to automatically expire documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model('Otp', otpSchema);

export default Otp;
