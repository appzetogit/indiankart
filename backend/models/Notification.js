import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema({
    type: {
        type: String,
        enum: ['order', 'return', 'stock', 'general'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedId: {
        type: String // ID of order, product, etc.
    },
    isRead: {
        type: Boolean,
        default: false
    },
    targetAudience: {
        type: String,
        default: 'All Users'
    },
    status: {
        type: String,
        enum: ['sent', 'pending', 'failed'],
        default: 'sent'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
