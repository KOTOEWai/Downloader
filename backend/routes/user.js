import express from 'express';
const router = express.Router();
import { login, register, getProfile, logout } from '../controllers/user.js';
import { protect } from '../middleware/middleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

router.post('/login', authLimiter, login)
router.post('/register', authLimiter, register)
router.post('/logout', logout)
router.get('/me', protect, getProfile)

export default router;





