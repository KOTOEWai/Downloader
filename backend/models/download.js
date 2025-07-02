import mongoose from 'mongoose';

const DownloadSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Refers to the 'User' model
        required: true // A download must be associated with a user
    },
    image:{
        type:String,
        required:true
    },
    originalVideoUrl: { // The original YouTube/video URL
        type: String,
        required: true
    },
    cloudinaryUrl: { // The URL of the file stored on Cloudinary
        type: String,
        required: true
    },
    cloudinaryPublicId: { // Cloudinary's public ID for the asset
        type: String,
        required: true
    },
    fileName: { // The original file name (e.g., from yt-dlp's title)
        type: String,
        required: true
    },
    fileType: { // e.g., 'video', 'audio'
        type: String,
        required: true
    },
    downloadedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Download', DownloadSchema);

