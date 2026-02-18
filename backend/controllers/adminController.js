import Admin from '../models/Admin.js';
import generateToken from '../utils/generateToken.js';

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
export const authAdmin = async (req, res) => {
    const { password } = req.body;
    const email = req.body.email?.toLowerCase().trim();
    console.log('Admin login attempt:', { email });

    const adminQuery = await Admin.findOne({ email });
    if (!adminQuery) {
        console.log('Admin not found with email:', email);
    } else {
        const isMatch = await adminQuery.matchPassword(password);
        console.log('Admin found. Password match:', isMatch);
    }

    if (adminQuery && (await adminQuery.matchPassword(password))) {
        const token = generateToken(res, adminQuery._id);
        res.json({
            _id: adminQuery._id,
            name: adminQuery.name,
            email: adminQuery.email,
            role: adminQuery.role,
            isAdmin: true,
            token
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Logout admin / clear cookie
// @route   POST /api/admin/logout
// @access  Public
export const logoutAdmin = (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
        secure: process.env.NODE_ENV !== 'development',
        sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none'
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private/Admin
export const getAdminProfile = async (req, res) => {
    const admin = {
        _id: req.user._id,
        name: req.user.name,
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
            admin.email = req.body.email || admin.email;

            if (req.body.password) {
                admin.password = req.body.password;
            }

            const updatedAdmin = await admin.save();

            generateToken(res, updatedAdmin._id);

            res.json({
                _id: updatedAdmin._id,
                name: updatedAdmin.name,
                email: updatedAdmin.email,
                role: updatedAdmin.role,
                isAdmin: true
            });
        } else {
            res.status(404).json({ message: 'Admin not found' });
        }
    } catch (error) {
        console.error('Error updating admin profile:', error);
        res.status(500).json({ message: error.message });
    }
};
