import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is required');
    }

    return process.env.JWT_SECRET;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Signs a session token and sets it as an httpOnly cookie.
 * Options: expiresMs (lifetime), claims (extra JWT fields).
 * Customer sessions last 30 days; admin sessions are issued with 8 hours and
 * carry { typ: 'admin', tv, mfa } (see controllers/adminController.js).
 */
const generateToken = (res, userId, cookieName = 'user_jwt', { expiresMs = 30 * DAY_MS, claims = {} } = {}) => {
    const token = jwt.sign({ id: userId, ...claims }, getJwtSecret(), {
        algorithm: 'HS256',
        expiresIn: Math.floor(expiresMs / 1000),
    });

    res.cookie(cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development', // Secure must be true for SameSite: none
        sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none', // 'none' required for cross-site cookies
        maxAge: expiresMs,
    });

    return token;
};

export default generateToken;
