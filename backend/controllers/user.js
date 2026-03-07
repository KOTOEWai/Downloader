import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Helper to set auth cookies
const sendTokenResponse = (user, statusCode, res, message) => {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "2d" });
    const csrfToken = crypto.randomBytes(32).toString('hex'); // Generate CSRF token

    const options = {
        expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        httpOnly: true, // Prevent XSS access
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    };

    // Set httpOnly token
    res.cookie('token', token, options);

    // Set double-submit CSRF token (readable by frontend)
    res.cookie('XSRF-TOKEN', csrfToken, {
        ...options,
        httpOnly: false // Allow JS to read it for Axios
    });

    // Set UI state cookie
    res.cookie('isLoggedIn', 'true', {
        ...options,
        httpOnly: false
    });

    res.status(statusCode).json({
        success: true,
        message,
        user: { id: user._id, email: user.email, username: user.username }
    });
};

export async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Please enter all fields.' });

    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }
        sendTokenResponse(user, 200, res, 'Logged in successfully!');
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
}

export async function register(req, res) {
    const { username, email, password } = req.body;
    if (!email || !password || !username) return res.status(400).json({ success: false, message: 'Please enter all fields.' });

    try {
        if (await User.findOne({ email })) return res.status(400).json({ success: false, message: 'User already exists.' });
        if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, email, password: hashedPassword });

        sendTokenResponse(user, 201, res, 'User registered successfully!');
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
}

export const logout = (req, res) => {
    res.cookie('token', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
    res.cookie('XSRF-TOKEN', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: false });
    res.cookie('isLoggedIn', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: false });
    res.status(200).json({ success: true, message: 'User logged out' });
};

export async function getProfile(req, res) {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Get Profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}