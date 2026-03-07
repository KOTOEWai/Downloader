import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
    // 1. Read token from cookies
    const token = req.cookies.token;

    if (!token || token === 'none') {
        return res.status(401).json({ success: false, message: 'Not authorized, no token available in cookies.' });
    }

    try {
        // 2. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authorized, user not found.' });
        }

        next();
    } catch (error) {
        console.error('Token verification error:', error.message);
        return res.status(401).json({ success: false, message: 'Not authorized, token failed.' });
    }
};

// Double Submit Cookie CSRF Protection
const csrfProtect = (req, res, next) => {
    // Allow simple GET requests without CSRF token
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const cookieToken = req.cookies['XSRF-TOKEN'];
    const headerToken = req.headers['x-xsrf-token']; // Axios sends this automatically

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({ success: false, message: 'CSRF token validation failed.' });
    }

    next();
};

export { protect, csrfProtect };