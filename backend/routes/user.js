import express from 'express';
const router = express.Router();
import { login, register, getProfile } from '../controllers/user.js';
import { protect } from '../middleware/middleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

router.post('/login', authLimiter, login)
router.post('/register', authLimiter, register)
router.get('/me', protect, getProfile)

export default router;





