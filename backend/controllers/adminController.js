import Admin from '../models/Admin.js';
import generateToken from '../utils/generateToken.js';

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
        const token = generateToken(res, adminQuery._id, 'admin_jwt');
        res.json({
            _id: adminQuery._id,
            name: adminQuery.name,
            username: adminQuery.username,
            email: adminQuery.email,
            role: adminQuery.role,
            isAdmin: true,
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
    const admin = {
        _id: req.user._id,
        name: req.user.name,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        isAdmin: true
    };
    res.status(200).json(admin);
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
                _id: updatedAdmin._id,
                name: updatedAdmin.name,
                username: updatedAdmin.username,
                email: updatedAdmin.email,
                role: updatedAdmin.role,
                isAdmin: true,
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
