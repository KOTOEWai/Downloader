import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Import your User model

const protect = async (req, res, next) => {

    let token;

    // Check if Authorization header exists and starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            if (!token || token === 'undefined' || token === 'null') {
                return res.status(401).json({ success: false, message: 'Not authorized, invalid token format.' });
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user to the request object (without password)
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Not authorized, user not found.' });
            }

            next(); // Proceed to the next middleware/route handler
        } catch (error) {
            console.error('Token verification error:', error.message);
            return res.status(401).json({ success: false, message: 'Not authorized, token failed.' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token.' });
    }
};

export { protect };