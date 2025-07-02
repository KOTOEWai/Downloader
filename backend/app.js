// backend/server.js (ES Module version)

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import GetInfoVideo from './routes/getVideo.js';
import UserRoute from './routes/user.js';
import { fileURLToPath } from 'url';
import { Server } from "socket.io";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 📍 __dirname Fix for ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ API Routes
app.use('/api', GetInfoVideo);
app.use('/user', UserRoute);



// ✅ Create downloads directory if not exists
const downloadDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir);
}

// ✅ Serve static downloads
app.use('/downloads', express.static(downloadDir));

// ✅ Test route
app.get('/', (req, res) => {
    res.send('Welcome to the MERN Video Downloader Backend!');
});

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// ✅ Start server
const server =app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

 const io = new Server(server,{
    cors:{
        origin: "http://localhost:5173", // or your frontend URL
        methods: ["GET", "POST"]
    }
 })

 export {io};