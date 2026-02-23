import mongoose from 'mongoose';

const fcmTokenSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    platform: {
        type: String,
        default: null
    },
    deviceId: {
        type: String,
        default: null
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const FcmToken = mongoose.model('FcmToken', fcmTokenSchema);

export default FcmToken;
