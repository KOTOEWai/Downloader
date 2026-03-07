import rateLimit from 'express-rate-limit';

// 🔐 Auth routes: Login/Register — 10 requests per 15 minutes
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 10,
    message: {
        success: false,
        message: 'Too many attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,     // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,      // Disable the `X-RateLimit-*` headers
});

// 📥 Download API: 5 requests per minute
export const downloadLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,  // 1 minute
    max: 5,
    message: {
        success: false,
        message: 'Download limit reached. Please wait 1 minute before trying again.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 🔍 Video info / Analyze: 10 requests per minute
export const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,  // 1 minute
    max: 10,
    message: {
        success: false,
        message: 'Too many requests. Please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 📊 Analytics: 30 requests per minute
export const analyticsLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: {
        success: false,
        message: 'Too many requests to analytics. Please try again shortly.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
