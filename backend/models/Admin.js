import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { normalizeAdminRole, normalizeSidebarPermissions } from '../constants/adminPermissions.js';

const adminSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['superadmin', 'subadmin', 'admin'],
        default: 'subadmin',
    },
    permissions: [{
        type: String
    }],
    lastLogin: {
        type: Date
    },
    fcmToken: {
        type: String,
        default: null
    },
    // Per-admin read marker for the sidebar order badge. Kept per account so
    // one admin opening Orders does not clear the badge for everyone else.
    ordersLastSeenAt: {
        type: Date,
        default: null
    },

    // ---- Login security ----
    // Two-step login with an authenticator app. Secrets are AES-GCM encrypted
    // (utils/totp.js); recovery codes are stored as SHA-256 hashes.
    mfaEnabled: { type: Boolean, default: false },
    mfaEnabledAt: { type: Date, default: null },
    mfaSecret: { type: String, select: false, default: null },
    mfaPendingSecret: { type: String, select: false, default: null },
    mfaRecoveryCodes: { type: [String], select: false, default: [] },
    mfaLastCounter: { type: Number, select: false, default: -1 },
    // Wrong passwords / codes in a row, and the lock they trigger.
    failedLoginCount: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    // Sessions carry this number; raising it signs the admin out everywhere
    // (password change, MFA reset, "log out all"). Starts at 1 so sessions
    // issued before this existed (no number) are no longer accepted.
    tokenVersion: { type: Number, default: 1 }
}, {
    timestamps: true,
});

adminSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

adminSchema.methods.getResolvedRole = function () {
    return normalizeAdminRole(this.role);
};

adminSchema.methods.getResolvedPermissions = function () {
    return normalizeSidebarPermissions(this.role, this.permissions);
};

adminSchema.pre('validate', function () {
    this.role = normalizeAdminRole(this.role);
    this.permissions = normalizeSidebarPermissions(this.role, this.permissions);
});

adminSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    // A new password ends every existing session.
    if (!this.isNew) {
        this.tokenVersion = (this.tokenVersion || 1) + 1;
    }
});

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
