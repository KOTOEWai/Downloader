import express from 'express';
import { getStats } from '../controllers/analytics.js';
import { protect } from '../middleware/middleware.js';

const router = express.Router();

router.get('/stats', protect, getStats);

export default router;
