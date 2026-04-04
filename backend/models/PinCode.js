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
    }
}, {
    timestamps: true
});

const PinCode = mongoose.model('PinCode', pinCodeSchema);
export default PinCode;
