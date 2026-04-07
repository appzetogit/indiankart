import mongoose from 'mongoose';

const pinCodeSchema = mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isCOD: {
        type: Boolean,
        default: true
    },
    deliveryTime: {
        type: Number,
        default: 3,
        min: 1
    },
    deliveryUnit: {
        type: String,
        enum: ['minutes', 'hours', 'days'],
        default: 'days'
    }
}, {
    timestamps: true
});

const PinCode = mongoose.model('PinCode', pinCodeSchema);
export default PinCode;
