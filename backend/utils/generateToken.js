import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is required');
    }

    return process.env.JWT_SECRET;
};

const generateToken = (res, userId, cookieName = 'user_jwt') => {
    const token = jwt.sign({ id: userId }, getJwtSecret(), {
        expiresIn: '30d',
    });

    res.cookie(cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development', // Secure must be true for SameSite: none
        sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none', // 'none' required for cross-site cookies
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return token;
};

export default generateToken;
