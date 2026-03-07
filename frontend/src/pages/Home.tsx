import React, { useEffect, useState, type ChangeEvent } from 'react';
import api, { API_BASE_URL } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { SiYoutube, SiTiktok, SiFacebook, SiInstagram, SiTwitch } from 'react-icons/si';

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
  fileName: string;
}

interface DownloadItem {
  fileName: string;
  cloudinaryUrl: string;
  downloadedAt: string;
  image: string;
  fileType: string;
  originalVideoUrl: string;
  _id: string;
}

const Home: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [message, setMessage] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<Format | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  const socket = io(API_BASE_URL);

  useEffect(() => {
    socket.on('download-progress', (data) => {
      setProgress(parseFloat(data.progress));
    });
    socket.on('upload-progress', (data) => {
      setProgress(parseFloat(data.progress));
    });
    socket.on('downloads-updated', () => {
      fetchDownloads();
    });
    return () => {
      socket.off('download-progress');
      socket.off('upload-progress');
      socket.off('downloads-updated');
    };
  }, []);

  useEffect(() => {
    fetchDownloads();
  }, []);

  const fetchDownloads = async () => {
    try {
      const response = await api.get('/api/getVideos');
      setDownloads(response.data.downloads);
    } catch (error) {
      console.error('Failed to fetch downloads:', error);
    }
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (!e.target.value) {
      setVideoInfo(null);
      setMessage('');
      setProgress(0);
    }
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
    if (!url) {
      setMessage('Please enter a video URL.');
      return;
    }

    setLoading(true);
    setMessage('');
    setVideoInfo(null);
    setSelectedFormat(null);

    try {
      const response = await api.post<ApiResponse>('/api/get-video-info', { url });
      if (response.data.success && response.data.data) {
        setVideoInfo(response.data.data);
        if (response.data.data.formats.length > 0) {
          setSelectedFormat(response.data.data.formats[0]);
        }
      } else {
        setMessage(response.data.message || 'Failed to fetch video information.');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error fetching video data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedFormat) return;

    setMessage(`Processing ${selectedFormat.resolution}...`);
    setProgress(1);

    try {
      const response = await api.post<ApiResponse>('/api/download-selected-video', {
        url,
        formatId: selectedFormat.format_id,
        ext: selectedFormat.ext,
        quality: selectedFormat.resolution,
        thumbnail: videoInfo?.thumbnail
      });

      if (response.data.success) {
        setMessage('Success! Added to your library.');
        setProgress(100);
        setTimeout(() => {
          setMessage('');
          setProgress(0);
        }, 3000);
      }
    } catch (error: any) {
      setMessage('Download failed: ' + (error.response?.data?.message || error.message));
      setProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this download forever?')) return;
    try {
      const response = await api.delete(`/api/delete/${id}`);
      if (response.data.success) {
        fetchDownloads();
      }
    } catch (error: any) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-20">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8 py-10"
      >
        <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
          Any Video. <br />
          <span className="text-gradient">Lightning Fast.</span>
        </h1>
        <p className="text-text-dim text-xl max-w-2xl mx-auto">
          Download videos from YouTube, TikTok, and more with our premium high-speed engine.
          No ads, no fuss, just quality.
        </p>

        <div className="max-w-3xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
          <div className="relative flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Paste video URL here..."
              value={url}
              onChange={handleUrlChange}
              className="input-field py-5 text-lg"
            />
            <button
              onClick={handleGetVideoInfo}
              disabled={loading}
              className="btn-primary sm:px-10 h-[64px] text-lg"
            >
              {loading ? <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : 'Analyze'}
            </button>
          </div>
        </div>
      </motion.section>

      {/* Results Area */}
      <AnimatePresence mode="wait">
        {videoInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass p-8 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-10"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
              <img
                src={videoInfo.thumbnail.startsWith('http') ? videoInfo.thumbnail : `https:${videoInfo.thumbnail}`}
                alt={videoInfo.title}
                className="w-full h-full object-cover aspect-video"
              />
              <div className="absolute bottom-4 right-4 bg-black/80 px-3 py-1 rounded-lg text-sm font-bold border border-white/10">
                {formatDuration(videoInfo.duration)}
              </div>
            </div>

            <div className="flex flex-col justify-between py-2">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold line-clamp-2 leading-tight text-text-main">{videoInfo.title}</h2>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-dim">Select Quality</label>
                    <select
                      value={selectedFormat?.format_id || ''}
                      onChange={(e) => {
                        const selected = videoInfo.formats.find(f => f.format_id === e.target.value);
                        if (selected) setSelectedFormat(selected);
                      }}
                      className="input-field bg-white/5 border border-white/10"
                    >
                      {videoInfo.formats.filter(f => f.ext !== 'mhtml').map((format) => (
                        <option key={format.format_id} value={format.format_id} className="bg-bg-deep text-text-main">
                          {format.ext.toUpperCase()} {format.resolution}
                          {format.filesize ? ` • ${(format.filesize / (1024 * 1024)).toFixed(1)} MB` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {progress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-primary font-medium">Downloading...</span>
                        <span className="text-text-dim font-bold">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary shadow-[0_0_10px_rgba(0,229,255,0.5)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {message && <p className="text-primary text-sm font-medium bg-primary/5 p-3 rounded-lg border border-primary/10">{message}</p>}
                </div>
              </div>

              <button
                onClick={handleDownload}
                disabled={progress > 0 && progress < 100}
                className="btn-primary w-full py-4 mt-6 text-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Start Download
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supported Platforms */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-10 border-y border-white/5"
      >
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 hover:opacity-100 transition-opacity duration-700 grayscale hover:grayscale-0">
          {[
            { name: 'YouTube', icon: 'SiYoutube', color: '#FF0000' },
            { name: 'TikTok', icon: 'SiTiktok', color: '#201f1fff' },
            { name: 'Facebook', icon: 'SiFacebook', color: '#1877F2' },
            { name: 'Instagram', icon: 'SiInstagram', color: '#E4405F' },
            { name: 'Twitch', icon: 'SiTwitch', color: '#9146FF' },
          ].map((platform) => (
            <div key={platform.name} className="flex flex-col items-center gap-3 group">
              <div className="text-4xl md:text-5xl transition-transform group-hover:scale-125 duration-300">
                {/* We'll use a dynamic approach or just import them */}
                {platform.name === 'YouTube' && <span style={{ color: platform.color }}><SiYoutube /></span>}
                {platform.name === 'TikTok' && <span style={{ color: platform.color }}><SiTiktok /></span>}
                {platform.name === 'Facebook' && <span style={{ color: platform.color }}><SiFacebook /></span>}
                {platform.name === 'Instagram' && <span style={{ color: platform.color }}><SiInstagram /></span>}
                {platform.name === 'Twitch' && <span style={{ color: platform.color }}><SiTwitch /></span>}
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-text-dim group-hover:text-text-main transition-colors">
                {platform.name}
              </span>
            </div>
          ))}
        </div>
      </motion.section>
      {/* Downloads Library */}
      <section className="space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Your Library</h2>
          <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400">
            {downloads.length} items
          </span>
        </div>

        {downloads.length === 0 ? (
          <div className="glass p-20 rounded-3xl text-center space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-text-dim">No downloads yet. Start by pasting a link above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {downloads.map((item, idx) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="glass rounded-2xl overflow-hidden group hover:shadow-primary/10 transition-shadow"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img src={item.image} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 flex items-center justify-center gap-3">
                    <a href={item.cloudinaryUrl} target="_blank" rel="noreferrer" className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-xl">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                    <button onClick={() => handleDelete(item._id)} className="p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-transform shadow-xl">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  {item.fileType === 'audio' && (
                    <div className="absolute top-2 left-2 bg-secondary/80 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Audio</div>
                  )}
                </div>
                <div className="p-5 space-y-4">
                  <h3 className="font-semibold text-sm line-clamp-1 text-text-main">{item.fileName}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-text-dim font-medium">{new Date(item.downloadedAt).toLocaleDateString()}</span>
                    <a href={item.originalVideoUrl} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider">Source</a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
