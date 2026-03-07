import express from 'express';
import { getStats } from '../controllers/analytics.js';
import { protect } from '../middleware/middleware.js';
import { analyticsLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/stats', protect, analyticsLimiter, getStats);

export default router;
