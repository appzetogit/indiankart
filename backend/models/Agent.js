import mongoose from 'mongoose';

const agentSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            default: '',
            trim: true
        },
        phone: {
            type: String,
            default: '',
            trim: true
        },
        referralCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },
        commissionPercent: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        },
        notes: {
            type: String,
            default: '',
            trim: true
        }
    },
    {
        timestamps: true
    }
);

agentSchema.index({ isActive: 1, createdAt: -1 });

const Agent = mongoose.model('Agent', agentSchema);

export default Agent;
