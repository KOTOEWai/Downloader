import express from 'express';
const router = express.Router();
import { login, register, getProfile } from '../controllers/user.js';
import { protect } from '../middleware/middleware.js';

router.post('/login', login)
router.post('/register', register)
router.get('/me', protect, getProfile)

export default router;





