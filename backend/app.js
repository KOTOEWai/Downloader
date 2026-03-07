// backend/server.js (ES Module version)

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import GetInfoVideo from './routes/getVideo.js';
import UserRoute from './routes/user.js';
import AnalyticsRoute from './routes/analytics.js';
import { fileURLToPath } from 'url';
import { Server } from "socket.io";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 📍 __dirname Fix for ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Security: HTTP headers (XSS, clickjacking, MIME sniff protection)
app.use(helmet());

// ✅ Trust proxy (required for rate-limiting behind Render/Vercel/Nginx)
app.set('trust proxy', 1);

// ✅ Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

// ✅ API Routes
app.use('/api', GetInfoVideo);
app.use('/user', UserRoute);
app.use('/analytics', AnalyticsRoute);



// ✅ Create downloads directory if not exists
const downloadDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir);
}

// ⚠️ Security: Removed public static serving of downloads to prevent unauthorized access.
// app.use('/downloads', express.static(downloadDir));

// ✅ Periodic Cleanup: Delete files older than 1 hour from downloads directory
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const FILE_MAX_AGE = 60 * 60 * 1000;    // 1 hour

setInterval(() => {
    fs.readdir(downloadDir, (err, files) => {
        if (err) return console.error('Cleanup error:', err);
        const now = Date.now();
        files.forEach(file => {
            const filePath = path.join(downloadDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                if (now - stats.mtimeMs > FILE_MAX_AGE) {
                    fs.unlink(filePath, (err) => {
                        if (err) console.error(`Failed to delete ${file}:`, err);
                        else console.log(`Deleted old file: ${file}`);
                    });
                }
            });
        });
    });
}, CLEANUP_INTERVAL);

// ✅ Test route
app.get('/', (req, res) => {
    res.send('Welcome to the MERN Video Downloader Backend!');
});

// ✅ MongoDB connection & Server Start
let io; // Declare io in a scope accessible for export

const startServer = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB connected');

        const server = app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });

        io = new Server(server, { // Assign to the outer io variable
            cors: {
                origin: allowedOrigins,
                methods: ["GET", "POST"]
            }
        });

        // Make io accessible for export
        app.set('io', io);

    } catch (err) {
        console.error('❌ Database connection stalled or failed:');
        console.error(err.message);
        // In production, we might want to exit if we can't connect to DB
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};

startServer();

// For routes that need socket.io, they can use req.app.get('io')
// Or we can continue exporting it if needed by refactoring exports
export { io }; // Export io from the outer scope