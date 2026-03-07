// ✅ getVideo.js (ESM version)
import express from 'express';
import { getInfo, selectedVideo, getDownloadedVideos, deleteVideo } from '../controllers/getVideoController.js';
import { protect } from '../middleware/middleware.js';
import { apiLimiter, downloadLimiter } from '../middleware/rateLimiter.js';
const router = express.Router();

router.post('/get-video-info', protect, apiLimiter, getInfo);
router.post('/download-selected-video', protect, downloadLimiter, selectedVideo);
router.get('/getVideos', protect, getDownloadedVideos);
router.delete('/delete/:id', protect, deleteVideo);

export default router; // ✅ ESM compatible export
