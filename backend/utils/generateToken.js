import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    throw new Error('JWT_SECRET is required');
}

const generateToken = (res, userId, cookieName = 'user_jwt') => {
    const token = jwt.sign({ id: userId }, jwtSecret, {
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
