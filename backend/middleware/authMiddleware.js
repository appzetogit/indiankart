import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import { findOrCreateHardcodedLoginUser, LEGACY_HARDCODED_USER_IDS } from '../controllers/authController.js';
import { normalizeAdminRole, normalizeSidebarPermissions } from '../constants/adminPermissions.js';

const getJwtSecret = () => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is required');
    }

    return process.env.JWT_SECRET;
};

const resolveAuthenticatedUser = async (req) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
        } catch (error) {
            console.error('Error extracting bearer token:', error);
        }
    }
    
    if (!token) {
        if (req.cookies.admin_jwt) {
            token = req.cookies.admin_jwt;
        } else if (req.cookies.user_jwt) {
            token = req.cookies.user_jwt;
        } else if (req.cookies.jwt) {
            // Backward compatibility for legacy shared cookie.
            token = req.cookies.jwt;
        }
    }

    if (token) {
        const decoded = jwt.verify(token, getJwtSecret());
        console.log('Decoded Token:', decoded);

        if (LEGACY_HARDCODED_USER_IDS[decoded.id]) {
            const user = await findOrCreateHardcodedLoginUser(LEGACY_HARDCODED_USER_IDS[decoded.id]);
            user.isAdmin = false;
            user.role = 'user';
            return user;
        }

        let user = await User.findById(decoded.id).select('-password');
        if (!user) {
            console.log('User not found in Users collection, checking Admin...');
            user = await Admin.findById(decoded.id).select('-password');
        }

        if (!user) {
             console.log('User not found in Admin collection either.');
             throw new Error('Not authorized, token failed');
        }

        if (user?.email && typeof user.getResolvedRole === 'function') {
            user.role = normalizeAdminRole(user.role);
            user.permissions = normalizeSidebarPermissions(user.role, user.permissions);
        }
        
        console.log('Authenticated User found:', user._id, 'Role:', user.role || 'User', 'IsAdmin:', user.isAdmin);
        return user;
    }

    return null;
};

export const protect = async (req, res, next) => {
    try {
        const user = await resolveAuthenticatedUser(req);
        if (!user) {
            console.log('No token found in cookies. Cookies present:', Object.keys(req.cookies || {}));
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth protect error:', error.message);
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

export const protectOptional = async (req, _res, next) => {
    try {
        const user = await resolveAuthenticatedUser(req);
        req.user = user || null;
    } catch (error) {
        console.error('Optional auth skipped due to token error:', error.message);
        req.user = null;
    }
    next();
};

const isAdminUser = (user) => Boolean(
    user && (user.isAdmin || (user.role && ['admin', 'superadmin', 'subadmin', 'editor', 'moderator'].includes(user.role)))
);

// Lets a verified admin see products hidden from customers. The admin panel
// sends X-Admin-View: 1; the header alone grants nothing, and customer
// requests (no header) skip the token lookup entirely.
export const detectAdminViewer = async (req, _res, next) => {
    req.isAdminViewer = false;
    if (req.headers['x-admin-view'] === '1') {
        try {
            const user = await resolveAuthenticatedUser(req);
            req.isAdminViewer = isAdminUser(user);
        } catch {
            req.isAdminViewer = false;
        }
    }
    next();
};

export const admin = (req, res, next) => {
    if (isAdminUser(req.user)) {
        next();
    } else {
        console.log('Access denied. Not an admin. User:', req.user._id);
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

// Page-level permission (the admin sidebar keys). Superadmins hold all keys.
export const requireAdminPermission = (key) => (req, res, next) => {
    const role = normalizeAdminRole(req.user?.role);
    const permissions = normalizeSidebarPermissions(role, req.user?.permissions);
    if (permissions.includes(key)) {
        return next();
    }
    return res.status(403).json({ message: 'You do not have permission for this page' });
};

export const requireSuperAdmin = (req, res, next) => {
    if (req.user && normalizeAdminRole(req.user.role) === 'superadmin') {
        return next();
    }

    return res.status(403).json({ message: 'Only superadmins can access this resource' });
};
