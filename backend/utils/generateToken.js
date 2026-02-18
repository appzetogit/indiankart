import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });

    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development', // Secure must be true for SameSite: none
        sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none', // 'none' required for cross-site cookies
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return token;
};

export default generateToken;
