import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv'; // environment variables တွေအတွက် dotenv ကို သုံးရင် ထည့်ပါ
import Download from '../models/download.js';
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

  // ✅ Security: Simple URL validation
  const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
  // Note: YouTube/TikTok URLs might be complex, so we'll just check if it's a valid-looking URL
  if (!url.startsWith('http')) {
    return res.status(400).json({ success: false, message: 'Invalid URL format.' });
  }

  // ✅ Cookies & User-Agent Support (To bypass bot detection)
  const cookiesPath = path.resolve('./cookies.txt');
  const commonArgs = [
    '--js-runtime', 'node',
    '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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



export function getHello(req, res) {
  return res.json({ message: "hello" })
}







export async function selectedVideo(req, res) {
  const io = req.app.get('io');
  const userId = req.user._id;
  const { url, formatId, ext, quality, thumbnail } = req.body;

  if (!url || !formatId || !ext || !quality) {
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  }

  const isAudioOnly = quality.toLowerCase().includes('audio only');
  const isTikTok = /[a-zA-Z]/.test(formatId);

  // Default arguments for basic streaming
  let args = ['-f', formatId, '--no-playlist', '--restrict-filenames', '-o', '-', '--', url];

  // Logic for advanced MP3 extraction
  if (isAudioOnly) {
    args = [
      '-f', formatId,
      '--no-playlist',
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '0', // Best quality
      '--restrict-filenames',
      '-o', '-',
      '--',
      url
    ];
  } else if (!isTikTok) {
    args = ['-f', formatId, '--no-playlist', '--restrict-filenames', '-o', '-', '--', url];
  }

  const cookiesPath = path.resolve('./cookies.txt');
  const commonArgs = [
    '--js-runtime', 'node',
    '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];

  if (fs.existsSync(cookiesPath)) {
    commonArgs.push('--cookies', cookiesPath);
  }

  const ytProcess = spawn('yt-dlp', [...commonArgs, ...args]);

  // Cloudinary upload stream
  const uploadStream = cloudinary.uploader.upload_stream(
    {
      resource_type: isAudioOnly ? 'video' : 'video',
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
        const newDownload = await Download.create({
          userId,
          image: thumbnail,
          originalVideoUrl: url,
          cloudinaryUrl: result.secure_url,
          cloudinaryPublicId: result.public_id,
          fileName: result.original_filename || `Download_${Date.now()}.${isAudioOnly ? 'mp3' : 'mp4'}`,
          fileType: isAudioOnly ? 'audio' : 'video',
        });

        io.emit('downloads-updated');

        if (!res.headersSent) {
          res.json({
            success: true,
            message: isAudioOnly ? 'MP3 Audio extracted successfully!' : 'Video streaming upload successful!',
            cloudinaryUrl: result.secure_url,
          });
        }
      } catch (dbError) {
        console.error('DB error after stream upload:', dbError);
      }
    }
  );

  ytProcess.stdout.pipe(uploadStream);

  // Monitor progress from stderr
  ytProcess.stderr.on('data', (data) => {
    const text = data.toString();
    const progressMatch = text.match(/\[download\]\s+(\d+\.\d+)%/);
    if (progressMatch) {
      io.emit('download-progress', { progress: parseFloat(progressMatch[1]) });
    }
    if (text.includes('[ExtractAudio]')) {
      console.log('[yt-dlp processing]', text);
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

/*export function extractAudio  (req, res) {
    // Frontend ကနေပို့မယ့် Download ပြီးသား video ရဲ့ fileName
    const { fileName ,url ,image } = req.body;
     const userId = req.user._id;
     const cleanedFileName = fileName.replace(/\.f\d+\.(mp4|webm|m4a|etc)$/, '.$1');
       
    // fileName ပါမပါ စစ်ဆေးခြင်း
    if (!fileName) {
        return res.status(400).json({ success: false, message: 'Video file name is required for audio extraction.' });
    }

    // Video file ရဲ့ full path ကို တည်ဆောက်ခြင်း
    const videoFilePath = path.join('./downloads', cleanedFileName);

    // Output audio file ရဲ့ နာမည်ကို တည်ဆောက်ခြင်း (original_name_audio.mp3)
    // path.parse() က filename ကို name နဲ့ ext ကို ခွဲပေးပါတယ်။
    const parsedPath = path.parse(cleanedFileName);
    const audioFileName = `${parsedPath.name}_audio.mp3`;
    const audioFilePath = path.join('./downloads', audioFileName);

    // FFmpeg command ကို တည်ဆောက်ခြင်း
    // -i "${videoFilePath}" : input video file
    // -vn                   : video stream ကို မပါဝင်စေဘဲ (no video)
    // -acodec libmp3lame    : MP3 encoder ကို သုံးဖို့ (အချို့ system တွေမှာ default ပါပြီးသား၊ မပါရင် install လုပ်ရနိုင်)
    // -q:a 2                : audio quality (2 က ကောင်းတဲ့ quality)
    // "${audioFilePath}"    : output audio file path
    // ပိုမိုရိုးရှင်းအောင် -ab 128k (average bitrate) ကိုသုံးနိုင်ပါတယ်။
    // `libmp3lame` မပါဘဲ `ffmpeg` ရဲ့ default audio codec ကိုလည်း သုံးနိုင်ပါတယ်။ (ဥပမာ: `-acodec copy` source codec နဲ့တူတာ)
    const command = `ffmpeg -i "${videoFilePath}" -vn -ar 44100 -ac 2 -b:a 192k "${audioFilePath}"`;
    // Alternatives:
    // const command = `ffmpeg -i "${videoFilePath}" -vn -ab 192k "${audioFilePath}"`; // -ab for average bitrate
    // const command = `ffmpeg -i "${videoFilePath}" -vn -codec:a libmp3lame -q:a 2 "${audioFilePath}"`; // specific mp3 encoder

    console.log(`Executing FFmpeg command for audio extraction: ${command}`);
    // command ကို run ခြင်း
    exec(command, async (error, stdout, stderr) => {
        if (error) {
            console.error(`Audio extraction exec error: ${error.message}`);
            // FFmpeg ရဲ့ error output ကိုလည်း ပြန်ပို့ပေးနိုင်ပါတယ်။
            return res.status(500).json({ success: false, message: `Audio extraction failed: ${error.message}` });
        }
        if (stderr) {
            console.error(`Audio extraction stderr: ${stderr}`); // warnings တွေဖြစ်နိုင်
        }
        console.log(`Audio extraction stdout: ${stdout}`);
       
       
        // Extraction ပြီးဆုံးကြောင်း အောင်မြင်စွာပြန်ကြားခြင်း
        const downloadUrl = `/downloads/${encodeURIComponent(audioFileName)}`; // Frontend ကို ပေးမယ့် download link
         const uploadCloud = path.resolve(audioFilePath);
        try {
           
            const uploadResult = await cloudinary.uploader.upload( uploadCloud, {
                resource_type: 'auto',
                folder: 'downloads',
                public_id: audioFileName,
            });

            console.log('Successfully audio uploaded to Cloudinary:', uploadResult.url);

         try {
                    const newDownload = await Download.create({
                        userId: userId,
                        image: image,
                        originalVideoUrl: url,
                        cloudinaryUrl: uploadResult.url,
                        cloudinaryPublicId: uploadResult.public_id,
                        fileName: audioFileName, // Use original title if available, else local filename
                        fileType:  'audio' 
                    });
                  
                    console.log('Download record saved to DB:', newDownload._id);
                } catch (dbError) {
                    console.error('Error saving download record to database:', dbError);
                   
                }

        res.json({
        success: true,
        message: 'Audio downloaded successfully!',
        fileName: audioFileName,
        downloadUrl: downloadUrl
    });

        } catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError);
            return res.status(500).json({ success: false, message: 'Upload to Cloudinary failed.' });
        }



       
    });
};
*/

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