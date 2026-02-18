import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
        } catch (error) {
            console.error('Error extracting bearer token:', error);
        }
    }
    
    if (!token && req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            console.log('Decoded Token:', decoded);

            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                console.log('User not found in Users collection, checking Admin...');
                req.user = await Admin.findById(decoded.id).select('-password');
            }

            if (!req.user) {
                 console.log('User not found in Admin collection either.');
                 res.status(401);
                 throw new Error('Not authorized, token failed');
            }
            
            console.log('Authenticated User found:', req.user._id, 'Role:', req.user.role || 'User', 'IsAdmin:', req.user.isAdmin);

            next();
        } catch (error) {
            console.error('Auth protect error:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        console.log('No token found in cookies. Cookies present:', Object.keys(req.cookies));
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const admin = (req, res, next) => {
    if (req.user && (req.user.isAdmin || (req.user.role && ['admin', 'superadmin', 'editor', 'moderator'].includes(req.user.role)))) {
        next();
    } else {
        console.log('Access denied. Not an admin. User:', req.user._id);
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};
