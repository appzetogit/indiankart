import Admin from '../models/Admin.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Coupon from '../models/Coupon.js';
import Return from '../models/Return.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';
import { getAdminPasswordProblem, isAdminLocked, ADMIN_MAX_FAILED_LOGINS, ADMIN_LOCK_MS } from '../utils/adminSecurity.js';
import {
    generateTotpSecret, verifyTotp, totpUri, encryptSecret, decryptSecret, generateRecoveryCodes, hashRecoveryCode,
} from '../utils/totp.js';
import {
    ADMIN_SIDEBAR_OPTIONS,
    normalizeAdminRole,
    normalizeSidebarPermissions
} from '../constants/adminPermissions.js';

const serializeAdmin = (adminDoc, includeMeta = false) => {
    const role = normalizeAdminRole(adminDoc.role);
    const sidebarPermissions = normalizeSidebarPermissions(role, adminDoc.permissions);

    return {
        _id: adminDoc._id,
        name: adminDoc.name,
        username: adminDoc.username,
        email: adminDoc.email,
        role,
        sidebarPermissions,
        isAdmin: true,
        mfaEnabled: Boolean(adminDoc.mfaEnabled),
        ...(includeMeta
            ? {
                createdAt: adminDoc.createdAt,
                updatedAt: adminDoc.updatedAt,
                lastLogin: adminDoc.lastLogin
            }
            : {})
    };
};

const DASHBOARD_SUMMARY_TTL_MS = 30 * 1000;
let dashboardSummaryCache = {
    payload: null,
    expiresAt: 0
};

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
const ADMIN_SESSION_MS = 8 * 60 * 60 * 1000;
const MFA_PENDING_MS = 5 * 60 * 1000;
const LOCKED_MESSAGE = 'Too many failed attempts. This account is locked for 15 minutes.';
// Compared against when no admin matches, so a wrong username takes as long as a wrong password.
const DUMMY_HASH = bcrypt.hashSync('no-such-admin-account', 12);

const issueAdminSession = (res, adminDoc, { mfa }) => generateToken(res, adminDoc._id, 'admin_jwt', {
    expiresMs: ADMIN_SESSION_MS,
    claims: { typ: 'admin', tv: adminDoc.tokenVersion || 1, mfa: Boolean(mfa) },
});

const recordFailedAdminLogin = async (adminDoc) => {
    const failed = (adminDoc.failedLoginCount || 0) + 1;
    const update = { failedLoginCount: failed };
    if (failed >= ADMIN_MAX_FAILED_LOGINS) {
        update.lockedUntil = new Date(Date.now() + ADMIN_LOCK_MS);
        update.failedLoginCount = 0;
        console.warn(`[admin-login] account ${adminDoc._id} locked after ${ADMIN_MAX_FAILED_LOGINS} failed attempts`);
    }
    await Admin.updateOne({ _id: adminDoc._id }, { $set: update });
    return Boolean(update.lockedUntil);
};

const loginSucceeded = async (res, adminDoc, { mfa }) => {
    await Admin.updateOne({ _id: adminDoc._id }, { $set: { failedLoginCount: 0, lockedUntil: null, lastLogin: new Date() } });
    const token = issueAdminSession(res, adminDoc, { mfa });
    return res.json({
        ...serializeAdmin(adminDoc),
        token,
        ...(adminDoc.mfaEnabled || process.env.ADMIN_MFA_REQUIRED !== 'true' ? {} : { mfaSetupRequired: true }),
    });
};

// @desc    Admin login, step 1: password. With two-step login on, answers with
//          a short-lived token for step 2 instead of a session.
// @route   POST /api/admin/login
// @access  Public
export const authAdmin = async (req, res) => {
    const { password } = req.body;
    const email = typeof req.body.email === 'string' ? req.body.email.toLowerCase().trim() : '';
    const username = typeof req.body.username === 'string' ? req.body.username.toLowerCase().trim() : '';
    const loginId = username || email;

    if (!loginId || typeof password !== 'string' || !password) {
        return res.status(400).json({ message: 'Username/email and password are required' });
    }

    const adminDoc = await Admin.findOne({ $or: [{ username: loginId }, { email: loginId }] });
    if (!adminDoc) {
        await bcrypt.compare(password, DUMMY_HASH);
        return res.status(401).json({ message: 'Invalid username/email or password' });
    }
    if (isAdminLocked(adminDoc)) {
        return res.status(429).json({ message: LOCKED_MESSAGE, code: 'ACCOUNT_LOCKED' });
    }
    if (!(await adminDoc.matchPassword(password))) {
        const locked = await recordFailedAdminLogin(adminDoc);
        return res.status(locked ? 429 : 401).json(locked
            ? { message: LOCKED_MESSAGE, code: 'ACCOUNT_LOCKED' }
            : { message: 'Invalid username/email or password' });
    }

    if (adminDoc.mfaEnabled) {
        const mfaToken = jwt.sign(
            { id: String(adminDoc._id), typ: 'admin_mfa_pending', tv: adminDoc.tokenVersion || 1 },
            process.env.JWT_SECRET,
            { algorithm: 'HS256', expiresIn: Math.floor(MFA_PENDING_MS / 1000) }
        );
        return res.json({ mfaRequired: true, mfaToken });
    }

    return loginSucceeded(res, adminDoc, { mfa: false });
};

// @desc    Admin login, step 2: 6-digit authenticator code or a recovery code
// @route   POST /api/admin/login/mfa
// @access  Public (needs the step-1 token)
export const verifyAdminLoginMfa = async (req, res) => {
    const { mfaToken, code } = req.body || {};
    let pending;
    try {
        pending = jwt.verify(String(mfaToken || ''), process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
        return res.status(401).json({ message: 'This login has expired. Please enter your password again.', code: 'MFA_LOGIN_EXPIRED' });
    }
    if (pending.typ !== 'admin_mfa_pending') {
        return res.status(401).json({ message: 'This login has expired. Please enter your password again.', code: 'MFA_LOGIN_EXPIRED' });
    }

    const adminDoc = await Admin.findById(pending.id).select('+mfaSecret +mfaRecoveryCodes +mfaLastCounter');
    if (!adminDoc || !adminDoc.mfaEnabled || pending.tv !== (adminDoc.tokenVersion || 1)) {
        return res.status(401).json({ message: 'This login has expired. Please enter your password again.', code: 'MFA_LOGIN_EXPIRED' });
    }
    if (isAdminLocked(adminDoc)) {
        return res.status(429).json({ message: LOCKED_MESSAGE, code: 'ACCOUNT_LOCKED' });
    }

    const cleanCode = String(code || '').trim();
    const secret = decryptSecret(adminDoc.mfaSecret);
    const counter = /^\d{6}$/.test(cleanCode.replace(/\s/g, ''))
        ? verifyTotp(secret, cleanCode, { lastUsedCounter: adminDoc.mfaLastCounter ?? -1 })
        : null;

    // Claim the code atomically so two requests can't both use it.
    if (counter !== null) {
        const claimed = await Admin.updateOne(
            { _id: adminDoc._id, $or: [{ mfaLastCounter: { $lt: counter } }, { mfaLastCounter: { $exists: false } }] },
            { $set: { mfaLastCounter: counter } }
        );
        if (claimed.modifiedCount === 1) {
            return loginSucceeded(res, adminDoc, { mfa: true });
        }
    }

    // Recovery code: single use.
    const hashed = hashRecoveryCode(cleanCode);
    const usedRecovery = cleanCode.length >= 10 && adminDoc.mfaRecoveryCodes?.includes(hashed)
        && (await Admin.updateOne({ _id: adminDoc._id, mfaRecoveryCodes: hashed }, { $pull: { mfaRecoveryCodes: hashed } })).modifiedCount === 1;
    if (usedRecovery) {
        const left = adminDoc.mfaRecoveryCodes.length - 1;
        console.warn(`[admin-login] recovery code used for ${adminDoc._id}; ${left} left`);
        res.set('X-Recovery-Codes-Left', String(left));
        return loginSucceeded(res, adminDoc, { mfa: true });
    }

    const locked = await recordFailedAdminLogin(adminDoc);
    return res.status(locked ? 429 : 401).json(locked
        ? { message: LOCKED_MESSAGE, code: 'ACCOUNT_LOCKED' }
        : { message: 'That code is not correct. Check the time on your phone and try again.', code: 'MFA_CODE_INVALID' });
};

// @desc    Start two-step login setup: confirm password, get a new secret
// @route   POST /api/admin/mfa/setup
// @access  Private/Admin
export const startAdminMfaSetup = async (req, res) => {
    const adminDoc = await Admin.findById(req.user._id);
    if (!adminDoc) return res.status(404).json({ message: 'Admin not found' });
    if (adminDoc.mfaEnabled) {
        return res.status(400).json({ message: 'Two-step login is already on for this account.' });
    }
    // Password again, so a stolen session can't attach the thief's phone.
    if (typeof req.body?.password !== 'string' || !(await adminDoc.matchPassword(req.body.password))) {
        return res.status(401).json({ message: 'Password is not correct.' });
    }
    const secret = generateTotpSecret();
    await Admin.updateOne({ _id: adminDoc._id }, { $set: { mfaPendingSecret: encryptSecret(secret) } });
    return res.json({
        secret,
        otpauthUrl: totpUri({ secret, account: adminDoc.email || adminDoc.username }),
    });
};

// @desc    Finish setup with the first code from the app; returns recovery codes once
// @route   POST /api/admin/mfa/enable
// @access  Private/Admin
export const enableAdminMfa = async (req, res) => {
    const adminDoc = await Admin.findById(req.user._id).select('+mfaPendingSecret');
    if (!adminDoc) return res.status(404).json({ message: 'Admin not found' });
    if (adminDoc.mfaEnabled) {
        return res.status(400).json({ message: 'Two-step login is already on for this account.' });
    }
    const secret = decryptSecret(adminDoc.mfaPendingSecret);
    if (!secret) {
        return res.status(400).json({ message: 'Start the setup again.' });
    }
    const counter = verifyTotp(secret, req.body?.code);
    if (counter === null) {
        return res.status(400).json({ message: 'That code is not correct. Check the time on your phone and try again.', code: 'MFA_CODE_INVALID' });
    }
    const recoveryCodes = generateRecoveryCodes();
    adminDoc.mfaEnabled = true;
    adminDoc.mfaEnabledAt = new Date();
    adminDoc.mfaSecret = encryptSecret(secret);
    adminDoc.mfaPendingSecret = null;
    adminDoc.mfaRecoveryCodes = recoveryCodes.map(hashRecoveryCode);
    adminDoc.mfaLastCounter = counter;
    await adminDoc.save();
    console.log(`[admin-mfa] two-step login enabled for ${adminDoc._id}`);
    // The current session predates the code step; replace it with one that counts as verified.
    const token = issueAdminSession(res, adminDoc, { mfa: true });
    return res.json({ ...serializeAdmin(adminDoc), token, recoveryCodes });
};

// @desc    Sign this admin out on every device
// @route   POST /api/admin/logout-all
// @access  Private/Admin
export const logoutAllAdminSessions = async (req, res) => {
    await Admin.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
    return logoutAdmin(req, res);
};

// @desc    Logout admin / clear cookie
// @route   POST /api/admin/logout
// @access  Public
export const logoutAdmin = (req, res) => {
    const cookieOptions = {
        httpOnly: true,
        expires: new Date(0),
        secure: process.env.NODE_ENV !== 'development',
        sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none'
    };
    res.cookie('admin_jwt', '', cookieOptions);
    // Clear legacy/shared cookie too.
    res.cookie('jwt', '', cookieOptions);
    res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private/Admin
export const getAdminProfile = async (req, res) => {
    res.status(200).json(serializeAdmin(req.user));
};

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private/Admin
export const updateAdminProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user._id);

        if (admin) {
            admin.name = req.body.name || admin.name;
            admin.username = req.body.username || admin.username;
            admin.email = req.body.email || admin.email;

            if (req.body.password) {
                const passwordProblem = getAdminPasswordProblem(req.body.password, admin);
                if (passwordProblem) {
                    return res.status(400).json({ message: passwordProblem });
                }
                admin.password = req.body.password;
            }

            const updatedAdmin = await admin.save();

            // A password change ends other sessions (tokenVersion moved on); keep this one.
            const token = issueAdminSession(res, updatedAdmin, { mfa: updatedAdmin.mfaEnabled });

            res.json({
                ...serializeAdmin(updatedAdmin),
                token
            });
        } else {
            res.status(404).json({ message: 'Admin not found' });
        }
    } catch (error) {
        console.error('Error updating admin profile:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get admin sidebar option catalog
// @route   GET /api/admin/sidebar-options
// @access  Private/Admin
export const getAdminSidebarOptions = async (req, res) => {
    res.json({ options: ADMIN_SIDEBAR_OPTIONS });
};

// @desc    List admins
// @route   GET /api/admin/manage-admins
// @access  Private/Superadmin
export const listAdmins = async (req, res) => {
    try {
        const admins = await Admin.find({}).sort({ createdAt: -1 });
        res.json(admins.map((adminDoc) => serializeAdmin(adminDoc, true)));
    } catch (error) {
        console.error('Error listing admins:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch admins' });
    }
};

// @desc    Create admin
// @route   POST /api/admin/manage-admins
// @access  Private/Superadmin
export const createAdmin = async (req, res) => {
    try {
        const {
            name,
            username,
            email,
            password,
            role,
            sidebarPermissions
        } = req.body;

        if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string'
            || !name.trim() || !email.trim() || !password.trim()) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }
        // The role must be chosen explicitly; a missing role used to mean superadmin.
        if (!['superadmin', 'subadmin'].includes(role)) {
            return res.status(400).json({ message: 'Choose a role: superadmin or subadmin' });
        }
        const passwordProblem = getAdminPasswordProblem(password, { name, email, username });
        if (passwordProblem) {
            return res.status(400).json({ message: passwordProblem });
        }

        const normalizedRole = normalizeAdminRole(role);
        const normalizedEmail = email.toLowerCase().trim();
        const normalizedUsername = username?.trim() ? username.toLowerCase().trim() : undefined;
        const normalizedPermissions = normalizeSidebarPermissions(normalizedRole, sidebarPermissions);

        if (normalizedRole === 'subadmin' && normalizedPermissions.length === 0) {
            return res.status(400).json({ message: 'Select at least one sidebar option for subadmin' });
        }

        const duplicateAdmin = await Admin.findOne({
            $or: [
                { email: normalizedEmail },
                ...(normalizedUsername ? [{ username: normalizedUsername }] : [])
            ]
        });

        if (duplicateAdmin) {
            return res.status(400).json({ message: 'Admin with this email or username already exists' });
        }

        const adminDoc = await Admin.create({
            name: name.trim(),
            username: normalizedUsername,
            email: normalizedEmail,
            password: password.trim(),
            role: normalizedRole,
            permissions: normalizedPermissions
        });

        res.status(201).json(serializeAdmin(adminDoc, true));
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ message: error.message || 'Failed to create admin' });
    }
};

// @desc    Update admin access
// @route   PUT /api/admin/manage-admins/:id
// @access  Private/Superadmin
export const updateAdminAccess = async (req, res) => {
    try {
        const adminDoc = await Admin.findById(req.params.id);

        if (!adminDoc) {
            return res.status(404).json({ message: 'Admin not found' });
        }
 
        if (req.body.role !== undefined && !['superadmin', 'subadmin'].includes(req.body.role)) {
            return res.status(400).json({ message: 'Choose a role: superadmin or subadmin' });
        }
        const nextRole = normalizeAdminRole(req.body.role || adminDoc.role);
        const nextPermissions = normalizeSidebarPermissions(
            nextRole,
            req.body.sidebarPermissions ?? adminDoc.permissions
        );

        if (String(adminDoc._id) === String(req.user._id) && nextRole !== 'superadmin') {
            return res.status(400).json({ message: 'You cannot remove your own superadmin access' });
        }

        if (nextRole === 'subadmin' && nextPermissions.length === 0) {
            return res.status(400).json({ message: 'Select at least one sidebar option for subadmin' });
        }

        const nextEmail = req.body.email?.trim()?.toLowerCase();
        const nextUsername = req.body.username?.trim()?.toLowerCase();

        if (nextEmail || nextUsername) {
            const duplicateAdmin = await Admin.findOne({
                _id: { $ne: adminDoc._id },
                $or: [
                    ...(nextEmail ? [{ email: nextEmail }] : []),
                    ...(nextUsername ? [{ username: nextUsername }] : [])
                ]
            });

            if (duplicateAdmin) {
                return res.status(400).json({ message: 'Admin with this email or username already exists' });
            }
        }

        adminDoc.name = req.body.name?.trim() || adminDoc.name;
        adminDoc.email = nextEmail || adminDoc.email;
        adminDoc.username = req.body.username === '' ? undefined : (nextUsername || adminDoc.username);
        adminDoc.role = nextRole;
        adminDoc.permissions = nextPermissions;

        if (typeof req.body.password === 'string' && req.body.password.trim()) {
            const passwordProblem = getAdminPasswordProblem(req.body.password, adminDoc);
            if (passwordProblem) {
                return res.status(400).json({ message: passwordProblem });
            }
            adminDoc.password = req.body.password.trim();
        }

        // Lost phone: a superadmin turns two-step login off for this admin.
        // They must set it up again at next login; their sessions end now.
        if (req.body.resetMfa === true || req.body.resetMfa === 'true') {
            if (String(adminDoc._id) === String(req.user._id)) {
                return res.status(400).json({ message: 'Ask another superadmin to reset your own two-step login.' });
            }
            adminDoc.mfaEnabled = false;
            adminDoc.mfaEnabledAt = null;
            adminDoc.mfaSecret = null;
            adminDoc.mfaPendingSecret = null;
            adminDoc.mfaRecoveryCodes = [];
            adminDoc.mfaLastCounter = -1;
            adminDoc.lockedUntil = null;
            adminDoc.failedLoginCount = 0;
            adminDoc.tokenVersion = (adminDoc.tokenVersion || 1) + 1;
            console.warn(`[admin-mfa] two-step login reset for ${adminDoc._id} by ${req.user._id}`);
        }

        const updatedAdmin = await adminDoc.save();
        res.json(serializeAdmin(updatedAdmin, true));
    } catch (error) {
        console.error('Error updating admin access:', error);
        res.status(500).json({ message: error.message || 'Failed to update admin' });
    }
};

// @desc    Delete admin
// @route   DELETE /api/admin/manage-admins/:id
// @access  Private/Superadmin
export const deleteAdmin = async (req, res) => {
    try {
        const adminDoc = await Admin.findById(req.params.id);

        if (!adminDoc) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (String(adminDoc._id) === String(req.user._id)) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }

        await adminDoc.deleteOne();
        res.json({ message: 'Admin deleted successfully' });
    } catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({ message: error.message || 'Failed to delete admin' });
    }
};

// @desc    Get admin dashboard summary
// @route   GET /api/admin/dashboard-summary
// @access  Private/Admin
export const getDashboardSummary = async (req, res) => {
    try {
        if (dashboardSummaryCache.payload && dashboardSummaryCache.expiresAt > Date.now()) {
            return res.json(dashboardSummaryCache.payload);
        }

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [
            totalProducts,
            totalOrders,
            totalUsers,
            totalCategories,
            activeCoupons,
            pendingReturns,
            productStats,
            revenueBuckets,
            todayOrdersCount,
            pendingOrders,
            recentOrders,
            recentUsers,
            recentReturns,
            topCustomers
        ] = await Promise.all([
            Product.countDocuments(),
            Order.countDocuments(),
            User.countDocuments(),
            Category.countDocuments(),
            Coupon.countDocuments({ active: true, isOffer: { $ne: true } }),
            Return.countDocuments({ status: 'Pending' }),
            Product.aggregate([
                {
                    $project: {
                        computedStock: {
                            $cond: {
                                if: { $and: [ { $isArray: "$skus" }, { $gt: [ { $size: "$skus" }, 0 ] } ] },
                                then: { $sum: "$skus.stock" },
                                else: { $ifNull: [ "$stock", 0 ] }
                            }
                        },
                        name: 1,
                        image: 1,
                        id: 1
                    }
                },
                {
                    $facet: {
                        totalStock: [
                            { $group: { _id: null, sum: { $sum: "$computedStock" } } }
                        ],
                        outOfStockCount: [
                            { $match: { computedStock: { $lte: 0 } } },
                            { $count: "count" }
                        ],
                        lowStock: [
                            { $match: { computedStock: { $gt: 0, $lte: 5 } } },
                            { $sort: { computedStock: 1 } },
                            { $limit: 5 }
                        ]
                    }
                }
            ]),
            Order.aggregate([
                {
                    $facet: {
                        totalRevenue: [
                            { $group: { _id: null, value: { $sum: { $ifNull: ['$totalPrice', 0] } } } }
                        ],
                        currentMonthRevenue: [
                            { $match: { createdAt: { $gte: currentMonthStart, $lt: nextMonthStart } } },
                            { $group: { _id: null, value: { $sum: { $ifNull: ['$totalPrice', 0] } } } }
                        ],
                        previousMonthRevenue: [
                            { $match: { createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } } },
                            { $group: { _id: null, value: { $sum: { $ifNull: ['$totalPrice', 0] } } } }
                        ],
                        todayRevenue: [
                            { $match: { createdAt: { $gte: todayStart, $lt: tomorrowStart } } },
                            { $group: { _id: null, value: { $sum: { $ifNull: ['$totalPrice', 0] } } } }
                        ]
                    }
                }
            ]),
            Order.countDocuments({ createdAt: { $gte: todayStart, $lt: tomorrowStart } }),
            Order.countDocuments({ status: { $in: ['Pending', 'Confirmed', 'Packed'] } }),
            Order.find({}, 'displayId user shippingAddress createdAt')
                .populate('user', 'name')
                .sort({ createdAt: -1 })
                .limit(6)
                .lean(),
            User.find({}, 'name createdAt').sort({ createdAt: -1 }).limit(6).lean(),
            Return.find({}, 'orderId createdAt date').sort({ createdAt: -1 }).limit(6).lean(),
            Order.aggregate([
                {
                    $group: {
                        _id: '$user',
                        spend: { $sum: { $ifNull: ['$totalPrice', 0] } },
                        orders: { $sum: 1 }
                    }
                },
                { $sort: { spend: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 0,
                        id: '$user._id',
                        name: { $ifNull: ['$user.name', 'Customer'] },
                        email: '$user.email',
                        spend: 1,
                        orders: 1
                    }
                }
            ])
        ]);

        const facetStock = productStats?.[0] || {};
        const totalStockUnits = Number(facetStock.totalStock?.[0]?.sum || 0);
        const outOfStockProducts = Number(facetStock.outOfStockCount?.[0]?.count || 0);
        const lowStockProducts = (facetStock.lowStock || []).map(p => ({
            id: p.id,
            name: p.name,
            image: p.image,
            computedStock: p.computedStock
        }));

        const revenueFacet = revenueBuckets?.[0] || {};
        const totalRevenue = Number(revenueFacet.totalRevenue?.[0]?.value || 0);
        const monthRevenue = Number(revenueFacet.currentMonthRevenue?.[0]?.value || 0);
        const previousMonthRevenue = Number(revenueFacet.previousMonthRevenue?.[0]?.value || 0);
        const todayRevenue = Number(revenueFacet.todayRevenue?.[0]?.value || 0);
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const revenueGrowthPct = previousMonthRevenue <= 0
            ? (monthRevenue > 0 ? 100 : 0)
            : ((monthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;

        const recentActivity = [
            ...recentOrders.map((order) => ({
                type: 'order',
                id: String(order._id),
                text: `New order ${order.displayId || order._id} placed by ${order?.user?.name || order?.shippingAddress?.name || 'Customer'}`,
                time: order.createdAt
            })),
            ...recentUsers.map((user) => ({
                type: 'user',
                id: String(user._id),
                text: `New user ${user.name || 'someone'} registered`,
                time: user.createdAt
            })),
            ...recentReturns.map((returnItem) => ({
                type: 'return',
                id: String(returnItem._id),
                text: `Return requested for Order ${returnItem.orderId}`,
                time: returnItem.createdAt || returnItem.date
            }))
        ]
            .filter((item) => item.time)
            .sort((first, second) => new Date(second.time).getTime() - new Date(first.time).getTime())
            .slice(0, 6);

        const payload = {
            metrics: {
                totalProducts,
                totalOrders,
                totalUsers,
                totalCategories,
                activeCoupons,
                totalStockUnits,
                outOfStockProducts
            },
            revenue: {
                todayRevenue,
                monthRevenue,
                previousMonthRevenue,
                totalRevenue,
                avgOrderValue,
                todayOrdersCount,
                revenueGrowthPct
            },
            tasks: {
                pendingOrders,
                pendingReturns
            },
            lowStockProducts,
            recentActivity,
            topCustomers
        };

        dashboardSummaryCache = {
            payload,
            expiresAt: Date.now() + DASHBOARD_SUMMARY_TTL_MS
        };

        res.json(payload);
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch dashboard summary' });
    }
};
