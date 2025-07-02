import { exec } from 'child_process';
import path from 'path';
 import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv'; // environment variables တွေအတွက် dotenv ကို သုံးရင် ထည့်ပါ
import Download from '../models/download.js';
import { spawn } from 'child_process';
import { io } from '../app.js';
dotenv.config(); // .env file က environment variables တွေကို load လုပ်ပါ

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true 
});





export function getInfo(req, res) {
    // ... (getInfo function code remains the same as your updated version)
    const { url } = req.body;
  

    if (!url) {
        return res.status(400).json({ success: false, message: 'URL is required.' });
    }

    const command = `yt-dlp --dump-json "${url}"`;

   

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error.message}`);
            return res.status(500).json({ success: false, message: `Could not fetch video info. Error: ${error.message}` });
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
        }

        try {
            const videoInfo = JSON.parse(stdout);

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
            return res.status(500).json({ success: false, message: 'Failed to parse video info from yt-dlp output.' });
        }
    });
}



export function getHello(req,res){
     return res.json({message:"hello"})
}




function uploadToCloudinaryWithProgress(filePath, fileName) {
  return new Promise((resolve, reject) => {
    const fileSize = fs.statSync(filePath).size;
    let uploaded = 0;

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'downloads',
        public_id: path.parse(fileName).name,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );

    const readStream = fs.createReadStream(filePath);
    readStream.on('data', (chunk) => {
      uploaded += chunk.length;
      const percent = (uploaded / fileSize) * 100;
      io.emit('upload-progress', { progress: percent.toFixed(2) });
    });

    readStream.pipe(stream);
  });
}

export async function selectedVideo(req, res) {
  const userId = req.user._id;
  const { url, formatId, ext, quality, thumbnail } = req.body;
 console.log(url)
  if (!url || !formatId || !ext || !quality) {
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  }

  const outputTemplate = path.join('./downloads', '%(title)s.%(ext)s');
  let args = [];
  const isTikTokFormatId = /[a-zA-Z]/.test(formatId);

  if (quality.toLowerCase().includes('audio only')) {
    args = ['-f', formatId, '--restrict-filenames', '-o', outputTemplate, url];
  } else if (isTikTokFormatId) {
    args = ['-f', formatId, '--restrict-filenames', '-o', outputTemplate, url];
  } else {
    args = [
      '-f', `${formatId}+bestaudio`,
      '--merge-output-format', ext || 'mp4',
      '--restrict-filenames',
      '-o', outputTemplate,
      url
    ];
  }

  const ytProcess = spawn('yt-dlp', args);
  let stdoutData = '', stderrData = '';

  ytProcess.stdout.on('data', (data) => {
    const text = data.toString();
    const progressMatch = text.match(/\[download\]\s+(\d+\.\d+)%/);
    if (progressMatch) {
      io.emit('download-progress', { progress: parseFloat(progressMatch[1]) });
    }
    stdoutData += text;
    console.log('[yt-dlp]', text);
  });

  ytProcess.stderr.on('data', (data) => {
    const err = data.toString();
    stderrData += err;
    console.error('[yt-dlp error]', err);
  });

  ytProcess.on('close', async (code) => {
    if (code !== 0) {
      return res.status(500).json({ success: false, message: `Download failed. Exit code: ${code}` });
    }

    const match = stdoutData.match(/\[download\] Destination: (.+)/);
    if (!match) {
      return res.status(500).json({ success: false, message: 'Failed to find download path in stdout' });
    }

    const fullDownloadedPath = match[1].trim();
    const fileName = path.basename(fullDownloadedPath);
    const finalDownloadUrl = `/downloads/${encodeURIComponent(fileName)}`;

    const uploadCloud = fullDownloadedPath.replace(/\.f\d+[a-z]?\.(mp4|webm|m4a)$/, '.$1');
    console.log('Upload target path:', uploadCloud);

    try {
      const uploadResult = await uploadToCloudinaryWithProgress(uploadCloud, fileName);
      
      try {
        fs.unlinkSync(uploadCloud);
      } catch (e) {
        console.warn('Failed to delete local file:', e.message);
      }

      await Download.create({
        userId,
        image: thumbnail,
        originalVideoUrl: url,
        cloudinaryUrl: uploadResult.url,
        cloudinaryPublicId: uploadResult.public_id,
        fileName,
        fileType: quality.toLowerCase().includes('audio only') ? 'audio' : 'video',
      });
      io.emit('downloads-updated')
      res.json({
        success: true,
        message: 'Downloaded and uploaded successfully.',
        fileName,
        downloadUrl: finalDownloadUrl,
      });
    } catch (uploadErr) {
      console.error('Cloudinary upload error:', uploadErr);
      res.status(500).json({ success: false, message: 'Upload to Cloudinary failed.' });
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

export async function getDownloadedVideos  (req, res) {
   
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