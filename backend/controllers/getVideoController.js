
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv'; // environment variables တွေအတွက် dotenv ကို သုံးရင် ထည့်ပါ
//import { fileURLToPath } from 'url';
//import mongoose from 'mongoose';
import Download from '../models/download.js';
import redisClient from '../config/redis.js';
import { spawn } from 'child_process';
dotenv.config(); // .env file က environment variables တွေကို load လုပ်ပါ

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});



export function getInfo(req, res) {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, message: 'URL is required.' });
  }

  // ✅ Security: URL validation using URL constructor
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ success: false, message: 'Invalid URL format.' });
    }
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid URL format.' });
  }

  // ✅ Cookies & User-Agent Support (To bypass bot detection)
  const cookiesPath = path.resolve('./cookies.txt');
  const userAgent = process.env.YT_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  const commonArgs = [
    '--js-runtimes', 'node',
    '--user-agent', userAgent,
    '--add-header', 'Accept-Language: en-US,en;q=0.9',
    '--add-header', 'Sec-Fetch-Mode: navigate'
  ];

  if (fs.existsSync(cookiesPath)) {
    commonArgs.push('--cookies', cookiesPath);
    console.log('✅ yt-dlp: Using cookies.txt');
  } else {
    console.log('⚠️ yt-dlp: cookies.txt not found at', cookiesPath);
  }

  // ✅ Security: Use spawn with '--' to prevent argument injection
  const ytProcess = spawn('yt-dlp', [...commonArgs, '--dump-json', '--no-playlist', '--', url]);

  let stdoutData = '';
  let stderrData = '';

  ytProcess.stdout.on('data', (data) => {
    stdoutData += data.toString();
  });

  ytProcess.stderr.on('data', (data) => {
    stderrData += data.toString();
  });

  ytProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`yt-dlp error (exit code ${code}): ${stderrData}`);
      return res.status(500).json({ success: false, message: 'Could not fetch video info.' });
    }

    try {
      const videoInfo = JSON.parse(stdoutData);

      const allSimplifiedFormats = Object.values(videoInfo.formats).map(f => ({
        format_id: f.format_id,
        ext: f.ext,
        resolution: f.resolution,
        filesize: f.filesize,
      })).filter(f => f.resolution && f.resolution !== 'unknown' && !f.resolution.startsWith('s'));

      const sortedFormats = allSimplifiedFormats.sort((a, b) => {
        const resA = parseInt(a.resolution.replace(/[^0-9]/g, '')) || 0;
        const resB = parseInt(b.resolution.replace(/[^0-9]/g, '')) || 0;

        if (a.resolution === 'audio only' && b.resolution !== 'audio only') return 1;
        if (b.resolution === 'audio only' && a.resolution !== 'audio only') return -1;

        return resB - resA;
      });

      res.json({
        success: true,
        message: 'Video info fetched successfully!',
        data: {
          title: videoInfo.title,
          thumbnail: videoInfo.thumbnail,
          duration: videoInfo.duration,
          formats: sortedFormats
        }
      });

    } catch (parseError) {
      console.error(`JSON parse error: ${parseError.message}`);
      return res.status(500).json({ success: false, message: 'Failed to parse video info.' });
    }
  });
}

export async function selectedVideo(req, res) {
  const io = req.app.get('io');
  const userId = req.user._id;
  const { url, formatId, ext, quality, thumbnail } = req.body;

  if (!url || !formatId || !ext || !quality) {
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  }

  // --- 🧠 REDIS CACHE CHECK ---
  const cacheKey = `video:${url}:${formatId}:${quality}`;
  try {
    const cachedDataString = await redisClient.get(cacheKey);
    if (cachedDataString) {
      console.log('⚡ Cache Hit! Serving from Redis:', cacheKey);
      const cachedData = JSON.parse(cachedDataString);

      // Instantly show 100% progress
      io.emit('download-progress', { progress: 100 });

      // Save a new DB record for THIS user so it shows up in their history
      await Download.create({
        userId,
        image: thumbnail,
        originalVideoUrl: url,
        cloudinaryUrl: cachedData.cloudinaryUrl,
        cloudinaryPublicId: cachedData.cloudinaryPublicId,
        fileName: cachedData.fileName,
        fileType: cachedData.fileType,
      });

      io.emit('downloads-updated');

      return res.json({
        success: true,
        message: 'Video retrieved instantly from cache!',
        cloudinaryUrl: cachedData.cloudinaryUrl,
      });
    }
  } catch (redisErr) {
    console.error('Redis Cache Check Error:', redisErr);
    // Proceed normally if Redis fails
  }

  const isAudioOnly = quality.toLowerCase().includes('audio only');
  const isTikTok = /[a-zA-Z]/.test(formatId);

  const cookiesPath = path.resolve('./cookies.txt');
  const userAgent = process.env.YT_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  const commonArgs = [
    '--js-runtimes', 'node',
    '--user-agent', userAgent,
    '--add-header', 'Accept-Language: en-US,en;q=0.9',
    '--add-header', 'Sec-Fetch-Mode: navigate'
  ];

  if (fs.existsSync(cookiesPath)) {
    commonArgs.push('--cookies', cookiesPath);
  }

  // ============================================================
  // YouTube videos: download to temp file (so ffmpeg can merge video+audio)
  // TikTok / Audio: pipe to stdout (no merging needed)
  // ============================================================
  const needsMerge = !isAudioOnly && !isTikTok;

  if (needsMerge) {
    // --- TEMP FILE APPROACH (YouTube) ---
    const tempFile = path.resolve(`./downloads/temp_${Date.now()}.mp4`);
    const args = [
      '-f', `${formatId}+bestaudio/best`,
      '--merge-output-format', 'mp4',
      '--no-playlist',
      '--restrict-filenames',
      '-o', tempFile,
      '--', url
    ];

    const ytProcess = spawn('yt-dlp', [...commonArgs, ...args]);

    ytProcess.stderr.on('data', (data) => {
      const text = data.toString();
      const progressMatch = text.match(/\[download\]\s+(\d+\.?\d*)%/);
      if (progressMatch) {
        io.emit('download-progress', { progress: parseFloat(progressMatch[1]) });
      }
    });

    ytProcess.on('close', async (code) => {
      if (code !== 0) {
        console.error(`yt-dlp process failed with code ${code}`);
        if (!res.headersSent) {
          return res.status(500).json({ success: false, message: 'Download failed. Please try again.' });
        }
        return;
      }

      try {
        // Upload merged file to Cloudinary
        io.emit('download-progress', { progress: 95 });
        const uploadResult = await cloudinary.uploader.upload(tempFile, {
          resource_type: 'video',
          folder: 'downloads',
          public_id: `merged_${Date.now()}_video`,
        });

        // Save to DB
        const fileName = uploadResult.original_filename || `Download_${Date.now()}.mp4`;
        const fileType = 'video';

        await Download.create({
          userId,
          image: thumbnail,
          originalVideoUrl: url,
          cloudinaryUrl: uploadResult.secure_url,
          cloudinaryPublicId: uploadResult.public_id,
          fileName,
          fileType,
        });

        // 🧠 Save to Redis Cache (TTL: 24 hours = 86400 seconds)
        try {
          const cacheData = {
            cloudinaryUrl: uploadResult.secure_url,
            cloudinaryPublicId: uploadResult.public_id,
            fileName,
            fileType
          };
          await redisClient.setEx(cacheKey, 86400, JSON.stringify(cacheData));
        } catch (redisSetErr) {
          console.error('Failed to set Redis cache:', redisSetErr);
        }

        io.emit('downloads-updated');
        io.emit('download-progress', { progress: 100 });

        if (!res.headersSent) {
          res.json({
            success: true,
            message: 'Video downloaded successfully!',
            cloudinaryUrl: uploadResult.secure_url,
          });
        }
      } catch (uploadErr) {
        console.error('Upload/DB error:', uploadErr);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Upload to cloud failed.' });
        }
      } finally {
        // Cleanup temp file
        fs.unlink(tempFile, (err) => {
          if (err && err.code !== 'ENOENT') console.error('Temp file cleanup error:', err);
        });
      }
    });

  } else {
    // --- STDOUT PIPE APPROACH (TikTok / Audio) ---
    let args;
    if (isAudioOnly) {
      args = [
        '-f', formatId,
        '--no-playlist',
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '--restrict-filenames',
        '-o', '-',
        '--', url
      ];
    } else {
      // TikTok
      args = ['-f', formatId, '--no-playlist', '--restrict-filenames', '-o', '-', '--', url];
    }

    const ytProcess = spawn('yt-dlp', [...commonArgs, ...args]);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'downloads',
        public_id: `stream_${Date.now()}_${isAudioOnly ? 'audio' : 'video'}`,
      },
      async (err, result) => {
        if (err) {
          console.error('Cloudinary stream error:', err);
          if (!res.headersSent) {
            return res.status(500).json({ success: false, message: 'Streaming upload to Cloudinary failed.' });
          }
          return;
        }

        try {
          const fileName = result.original_filename || `Download_${Date.now()}.${isAudioOnly ? 'mp3' : 'mp4'}`;
          const fileType = isAudioOnly ? 'audio' : 'video';

          await Download.create({
            userId,
            image: thumbnail,
            originalVideoUrl: url,
            cloudinaryUrl: result.secure_url,
            cloudinaryPublicId: result.public_id,
            fileName,
            fileType,
          });

          // 🧠 Save to Redis Cache (TTL: 24 hours = 86400 seconds)
          try {
            const cacheData = {
              cloudinaryUrl: result.secure_url,
              cloudinaryPublicId: result.public_id,
              fileName,
              fileType
            };
            await redisClient.setEx(cacheKey, 86400, JSON.stringify(cacheData));
          } catch (redisSetErr) {
            console.error('Failed to set Redis cache:', redisSetErr);
          }

          io.emit('downloads-updated');

          if (!res.headersSent) {
            res.json({
              success: true,
              message: isAudioOnly ? 'MP3 Audio extracted successfully!' : 'Video downloaded successfully!',
              cloudinaryUrl: result.secure_url,
            });
          }
        } catch (dbError) {
          console.error('DB error after stream upload:', dbError);
        }
      }
    );

    ytProcess.stdout.pipe(uploadStream);

    ytProcess.stderr.on('data', (data) => {
      const text = data.toString();
      const progressMatch = text.match(/\[download\]\s+(\d+\.?\d*)%/);
      if (progressMatch) {
        io.emit('download-progress', { progress: parseFloat(progressMatch[1]) });
      }
    });

    ytProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`yt-dlp process failed with code ${code}`);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Process failed. Please try again.' });
        }
      }
    });
  }
}

export async function getDownloadedVideos(req, res) {

  try {
    const downloads = await Download.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, downloads });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch downloads' });
  }
}

export async function deleteVideo(req, res) {
  const userId = req.user._id;
  const { id } = req.params;

  try {
    // Step 1: Find the download record
    const download = await Download.findById(id);

    if (!download || download.userId.toString() !== userId.toString()) {
      return res.status(404).json({ success: false, message: 'Download not found or unauthorized.' });
    }

    // Step 2: Delete from Cloudinary
    const publicId = download.cloudinaryPublicId;
    const resourceType = download.fileType === 'audio' ? 'video' : 'video'; // adjust if needed

    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

    // Step 3: Delete from MongoDB
    await Download.findByIdAndDelete(id);

    res.json({ success: true, message: 'Download deleted successfully!' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete the download.' });
  }
}