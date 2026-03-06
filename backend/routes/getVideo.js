// ✅ getVideo.js (ESM version)
import express from 'express';
import { getInfo, selectedVideo, getHello, getDownloadedVideos, deleteVideo } from '../controllers/getVideoController.js';
import { protect } from '../middleware/middleware.js';
const router = express.Router();

router.post('/get-video-info', protect, getInfo);
router.post('/download-selected-video', protect, selectedVideo);
//router.post('/extract-Audio',protect, extractAudio);
router.get('/getVideos', protect, getDownloadedVideos);
router.delete('/delete/:id', protect, deleteVideo);
router.get('/', getHello);

export default router; // ✅ ESM compatible export
