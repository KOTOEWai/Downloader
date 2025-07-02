import React, { useEffect, useState, type ChangeEvent } from 'react';
import axios from 'axios';
import Loading from '../components/loading';
import { motion } from 'framer-motion';
import { io} from 'socket.io-client';
import '../App.css'
// ---------- Types ----------
interface Format {
  format_id: string;
  ext: string;
  resolution: string;
  filesize?: number;
}

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: number;
  formats: Format[];
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: VideoInfo;
  downloadUrl?: string;
  fileName:string;

}
interface DownloadItem {
  fileName: string;
  cloudinaryUrl: string;
  downloadedAt: string;
  image: string;
  fileType:string;
originalVideoUrl:string;
_id:string;
}

const Home: React.FC = () => {
 
  const token = localStorage.getItem('token')
  const [url, setUrl] = useState<string>('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [message, setMessage] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<Format | null>(null);
  const [downloadLink, setDownloadLink] = useState<string>('');
  const [downloadedFileName, setDownloadedFileName] = useState(''); // ဒါကို ထပ်ထည့်ပါ: Download ပြီးသား video file နာမည် သိမ်းဖို့
  const [audioDownloadLink, setAudioDownloadLink] = useState('');
  const [loading,setLoading] = useState(false);
  const BASE_URL = 'http://localhost:3000';
  const socket = io('http://localhost:3000');

const [ progress,setProgress] = useState<number>(0);

useEffect(() => {
  socket.on('download-progress', (data) => {
    console.log(data)
    setProgress(parseFloat(data.progress));
  });
   socket.on('upload-progress', (data) => {
    setProgress(parseFloat(data.progress)); // Upload progress updates
  });
 socket.on('downloads-updated', () => {
    fetchDownloads(); // 🔁 re-fetch when update occurs
  });
  return () => {
    socket.off('download-progress');
    socket.off('upload-progress');
    socket.off('downloads-updated'); 
  };
}, []);

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setVideoInfo(null);
    setMessage('');
    setDownloadLink('');
    setDownloadedFileName(''); // URL ပြောင်းရင် ရှင်း
    setAudioDownloadLink('');
    setSelectedFormat(null);
    setProgress(0)
    setLoading(false)

  };

  const getThumbnailUrl = (thumbnail: string): string => {
    return thumbnail.startsWith('http') ? thumbnail : `https:${thumbnail}`;
  };

  const formatDuration = (seconds: number): string => {
    if (typeof seconds !== 'number' || isNaN(seconds)) return 'N/A';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [h, m, s].map(v => (v < 10 ? '0' + v : v));
    return h === 0 ? parts.slice(1).join(':') : parts.join(':');
  };

  const handleGetVideoInfo = async () => {
    setMessage('ကျေးဇူးပြု၍ ခတ္တ စောင့်ပါခဗျ........');
    setLoading(true)
    setVideoInfo(null);
    setDownloadLink('');
    setDownloadedFileName(''); // URL ပြောင်းရင် ရှင်း
    setAudioDownloadLink('');
    setSelectedFormat(null);

    if (!url) {
      setMessage('Please enter a video URL.');
      setLoading(false)
      return;
    }

    try {
      const response = await axios.post<ApiResponse>(`${BASE_URL}/api/get-video-info`, { url });

      if (response.data.success && response.data.data) {
        setVideoInfo(response.data.data);
        setMessage('');
        setLoading(false)
        if (response.data.data.formats.length > 0) {
          setSelectedFormat(response.data.data.formats[0]);
        }
      } else {
        setMessage(response.data.message || 'Failed to fetch video information.');
      }
    } catch (error: any) {
      setMessage('Error: ' + (error.response?.data?.message || error.message || 'Unknown error.'));
    }
  };

  const handleDownloadSelectedVideo = async () => {
    if (!selectedFormat) {
      setMessage('Please select a video quality to download.');
      return;
    }

    setMessage(`Downloading ${selectedFormat.resolution} ${selectedFormat.ext.toUpperCase()}...`);
    setDownloadLink('');
    setDownloadedFileName(''); 
    setAudioDownloadLink('');
   

    try {
      const response = await axios.post<ApiResponse>(`${BASE_URL}/api/download-selected-video`, {
        url,
        formatId: selectedFormat.format_id,
        ext: selectedFormat.ext,
        quality: selectedFormat.resolution,
        thumbnail:videoInfo?.thumbnail
      },{
        headers:{
          Authorization:`Bearer ${token}`
        }
      });
      if (response.data.success) {
         fetchDownloads();
        setMessage(response.data.message || 'Download started.');
        setTimeout(()=>{
          setMessage('');
        },3000)
         
        if (response.data.downloadUrl) {
          setDownloadLink(`${BASE_URL}${response.data.downloadUrl}`);
          setDownloadedFileName(response.data.fileName);
          
        } 
      } else {
        setMessage(response.data.message || 'Video download failed.');
        setTimeout(()=>{
          setMessage('');
        },1000)
      }
    } catch (error: any) {
      setMessage('Download error: ' + (error.response?.data?.message || error.message || 'Unknown error.'));
      setTimeout(()=>{
          setMessage('');
        },1000)
    }
  };


  /* const handleExtractAudio = async () => {
        if (!downloadedFileName) {
            setMessage('Please download the video first to extract audio.');
            return;
        }

        setMessage(`Extracting audio from "${downloadedFileName}"...`);
        setAudioDownloadLink(''); // extract မလုပ်ခင် ရှင်း

        try {
            const response = await axios.post(`${BASE_URL}/api/extract-Audio`, {
                fileName: downloadedFileName, // Backend ကို download ပြီးသား file နာမည် ပို့
                url:url,
                image:videoInfo?.thumbnail,
            },{
        headers:{
          Authorization:`Bearer ${token}`
        }});

            if (response.data.success) {
             
                setMessage(response.data.message);
                if (response.data.downloadUrl) {
                    setAudioDownloadLink(`${BASE_URL}${response.data.downloadUrl}`);
                     fetchDownloads()
                }
            } else {
                setMessage(response.data.message || 'Audio extraction failed.');
            }
        } catch (error:any) {
            console.error('Error extracting audio:', error);
            setMessage('Error extracting audio: ' + (error.response?.data?.message || error.message || 'Unknown error.'));
        }
    };
  */

  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  

  const fetchDownloads = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/getVideos', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    setDownloads(response.data.downloads);
  } catch (error) {
    console.error('Failed to fetch downloads:', error);
  }
};

useEffect(() => {
  fetchDownloads(); // fetch once on page load
}, []);

const handleDelete = async (id:any) => {
  const confirmDelete = window.confirm('Are you sure you want to delete this download?');
  if (!confirmDelete) return;
   setLoading(true)

  try {
    const response = await axios.delete(`${BASE_URL}/api/delete/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.success) {
     
      setMessage('Deleted successfully!');
      setTimeout(()=>{
          setMessage('');
           fetchDownloads(); 
        },3000)
     
       setLoading(false);
    } else {
      setMessage(response.data.message || 'Failed to delete.');
    }
  } catch (error: any) {
    setMessage('Error deleting: ' + (error.response?.data?.message || error.message));
  }
};


  return (
    <div className="min-h-screen bg-gray-100 p-6" >
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-6" style={{backgroundColor:"#E2E8F0"}}>
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-blue-700">
          Free Online Video Downloader
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Enter YouTube or video URL"
            value={url}
            onChange={handleUrlChange}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleGetVideoInfo}
            className="px-4 py-2 text-white rounded-md hover:bg-blue-700 transition" style={{background:'#00B4D8'}}
          >
            Get Video Info
          </button>
        </div>

{progress > 0 && progress < 100 && (
  <div className="w-full">
    <div className="flex items-center justify-between gap-4 mb-2">
      <h6 className="text-blue-gray-900">
        {progress >= 100 ? 'Completed' : 'Downloading...'}
      </h6>
      <h6 className="text-blue-gray-900">
        {Number(progress).toFixed(2)}%
      </h6>
    </div>
    <div className="h-2.5 w-full bg-blue-gray-50 rounded-full">
      <div
        style={{ width: `${progress}%` }}
        className="h-full bg-gray-900 rounded-full"
      />
    </div>
  </div>
)}


        {message && <p className="text-center text-gray-700 mb-4 "> 
 <button className="animate-bounce rounded  px-4 py-2 font-bold text-blue-600 hover:bg-blue-100">{message}</button></p>}
        {loading && <Loading/>}
        {videoInfo && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative">
                <img
                  src={getThumbnailUrl(videoInfo.thumbnail)}
                  alt={videoInfo.title}
                  className="w-64 h-auto rounded-lg shadow-md"
                />
                {videoInfo.duration && (
                  <span className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(videoInfo.duration)}
                  </span>
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">{videoInfo.title}</h2>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <select
                    value={selectedFormat?.format_id || ''}
                    onChange={(e) => {
                      const selected = videoInfo.formats.find(f => f.format_id === e.target.value);
                      if (selected) setSelectedFormat(selected);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md"
                  >
                    {videoInfo.formats.filter(format=>format.ext!=='mhtml').map((format) => (
                      <option key={format.format_id} value={format.format_id}>
                        {format.ext.toUpperCase()} {format.resolution}
                        {format.filesize && ` (${(format.filesize / (1024 * 1024)).toFixed(2)} MB)`}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleDownloadSelectedVideo}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                  >
                    Download
                  </button>
                </div>

                {downloadLink && (
                  <p className="mt-4 text-green-700 font-medium">
                    Download Complete!{' '}
                    <a
                      href={downloadLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-blue-600"
                    >
                      Click to Download File
                    </a>
                  </p>
                )}

             {downloadedFileName && ( // Video download ပြီးမှ Audio Extraction ခလုတ်ကို ပြပါမယ်
                            <div className="audio-extraction-section" style={{ marginTop: '20px' }}>
                                <button className="extract-audio-btn" >
                                    Extract Audio (MP3)
                                </button>
                                {audioDownloadLink && (
                                    <p className="download-link-text" style={{ fontSize: '0.95em', color: '#6c757d' }}>
                                        Audio Extraction Complete! <a href={audioDownloadLink} target="_blank" rel="noopener noreferrer"  className="underline text-blue-600">Click to Download Audio File</a>
                                    </p>
                                )}
                            </div>
                        )}
              </div>
            </div>
          </div>
        )}


        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            By using our service you accept our{' '}
            <a href="#" className="underline text-blue-500">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="underline text-blue-500">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>

<div className="mx-auto mt-10 bg-white p-6 rounded-xl max-w-7xl  overflow-x-auto" style={{height:"30rem"}}>
  <h2 className="text-2xl font-bold mb-6 text-blue-700 text-center">My Downloaded Videos</h2>
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
    {downloads.map((item, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        whileHover={{ scale: 1.02 }}
        className="bg-gray-100 rounded-xl shadow-md overflow-hidden"
      >
       <div className="w-full relative">
  {item.fileType === 'audio' ? (
    <div className="relative">
      <img
        src={item.image}
        alt="Audio thumbnail"
        className="w-full h-48 object-cover rounded-t-xl"
      />
      <div className="absolute inset-0 flex items-center justify-center  bg-opacity-40">
        <audio controls className="w-11/12">
          <source src={item.cloudinaryUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  ) : (
    <video controls className="w-full h-48 object-cover rounded-t-xl">
      <source src={item.cloudinaryUrl} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  )}
</div>


        <div className="p-4">
          <h3 className="text-sm font-semibold text-indigo-700 truncate">{item.fileName}</h3>
          <p className="text-xs text-gray-600 mt-1">
            Downloaded at:{' '}
            <span className="font-medium text-gray-800">
              {new Date(item.downloadedAt).toLocaleString()}
            </span>
          </p>
          <div className="mt-3 text-right">
            <a
              href={item.originalVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white text-xs font-light px-2 py-2 rounded-md transition"
            >
             See Original
            </a>

            <button
  onClick={() => handleDelete(item._id)}
  className="inline-block bg-red-500 mx-3  text-white text-xs font-light px-2 py-2 rounded-md transition"
>
  Delete
</button>

          </div>
        </div>
      </motion.div>
    ))}
  </div>
</div>




    </div>
  );
};

export default Home;
