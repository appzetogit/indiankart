import Admin from '../models/Admin.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Coupon from '../models/Coupon.js';
import Return from '../models/Return.js';
import generateToken from '../utils/generateToken.js';
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
        ...(includeMeta
            ? {
                createdAt: adminDoc.createdAt,
                updatedAt: adminDoc.updatedAt,
                lastLogin: adminDoc.lastLogin
            }
            : {})
    };
};

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
export const authAdmin = async (req, res) => {
    const { password } = req.body;
    const email = req.body.email?.toLowerCase().trim();
    const username = req.body.username?.toLowerCase().trim();
    const loginId = username || email;

    if (!loginId || !password) {
        return res.status(400).json({ message: 'Username/email and password are required' });
    }

    const adminQuery = await Admin.findOne({
        $or: [{ username: loginId }, { email: loginId }]
    });

    if (adminQuery && (await adminQuery.matchPassword(password))) {
        adminQuery.lastLogin = new Date();
        await adminQuery.save();

        const token = generateToken(res, adminQuery._id, 'admin_jwt');
        res.json({
            ...serializeAdmin(adminQuery),
            token
        });
    } else {
        res.status(401).json({ message: 'Invalid username/email or password' });
    }
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
                admin.password = req.body.password;
            }

            const updatedAdmin = await admin.save();

            const token = generateToken(res, updatedAdmin._id, 'admin_jwt');

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

        if (!name?.trim() || !email?.trim() || !password?.trim()) {
            return res.status(400).json({ message: 'Name, email and password are required' });
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

        if (req.body.password?.trim()) {
            adminDoc.password = req.body.password.trim();
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
            productsForStock,
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
            Product.find({}, 'id name image stock skus').lean(),
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

        const totalStockUnits = productsForStock.reduce((sum, product) => {
            const skuStock = Array.isArray(product?.skus)
                ? product.skus.reduce((skuSum, sku) => skuSum + (Number(sku?.stock) || 0), 0)
                : 0;
            const computedStock = Array.isArray(product?.skus) && product.skus.length > 0
                ? skuStock
                : (Number(product?.stock) || 0);
            return sum + computedStock;
        }, 0);

        const lowStockProducts = productsForStock
            .map((product) => {
                const skuStock = Array.isArray(product?.skus)
                    ? product.skus.reduce((sum, sku) => sum + (Number(sku?.stock) || 0), 0)
                    : 0;
                const computedStock = Array.isArray(product?.skus) && product.skus.length > 0
                    ? skuStock
                    : (Number(product?.stock) || 0);

                return {
                    id: product.id,
                    name: product.name,
                    image: product.image,
                    computedStock
                };
            })
            .filter((product) => product.computedStock > 0 && product.computedStock <= 5)
            .sort((first, second) => first.computedStock - second.computedStock)
            .slice(0, 5);

        const outOfStockProducts = productsForStock.reduce((count, product) => {
            const skuStock = Array.isArray(product?.skus)
                ? product.skus.reduce((sum, sku) => sum + (Number(sku?.stock) || 0), 0)
                : 0;
            const computedStock = Array.isArray(product?.skus) && product.skus.length > 0
                ? skuStock
                : (Number(product?.stock) || 0);
            return count + (computedStock <= 0 ? 1 : 0);
        }, 0);

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

        res.json({
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
        });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch dashboard summary' });
    }
};
