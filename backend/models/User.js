import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: false,
        default: ''
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    phone: { // Added to support OTP flow if needed directly in schema
        type: String
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', '']
    },
    status: {
        type: String,
        enum: ['active', 'disabled'],
        default: 'active'
    },
    fcmTokenWeb: {
        type: String,
        default: null
    },
    fcmTokenMobile: {
        type: String,
        default: null
    },
    fcmToken: {
        type: String,
        default: null
    },
    addresses: [
        {
            name: { type: String, default: '' },
            mobile: { type: String, default: '' },
            email: { type: String, default: '' },
            pincode: { type: String, default: '' },
            address: { type: String, default: '' },
            city: { type: String, default: '' },
            state: { type: String, default: '' },
            type: { type: String, default: 'Home' },
            isDefault: { type: Boolean, default: false }
        }
    ]
}, {
    timestamps: true,
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

export default User;
