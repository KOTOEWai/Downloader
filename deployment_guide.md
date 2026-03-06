# Deployment Guide

This guide provides instructions on how to deploy the VideoDownloader application using Docker or manual methods.

## Prerequisites
- Docker & Docker Compose (Recommended)
- Node.js 18+ & npm (Manual)
- FFmpeg installed on host (Manual)
- yt-dlp installed on host (Manual)

## Method 1: Docker Deployment (Recommended)

Docker handles all dependencies (FFmpeg, yt-dlp, Python) automatically.

1. **Configure Environment Variables**:
   Ensure `backend/.env` is correctly populated with:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `ALLOWED_ORIGINS`

2. **Run with Docker Compose**:
   In the root directory, run:
   ```bash
   docker-compose up -d --build
   ```
   This will start:
   - **Frontend**: http://localhost:80
   - **Backend**: http://localhost:3000

---

## Method 2: Manual Deployment

1. **Install Dependencies**:
   ```bash
   # In the root directory
   npm run install:all
   ```

2. **Build the Frontend**:
   ```bash
   cd frontend
   npm run build
   ```

3. **Start the Backend**:
   ```bash
   cd backend
   npm start
   ```

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for JWT | `your_secret_key` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Name | `...` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `...` |
| `CLOUDINARY_API_SECRET` | Cloudinary Secret | `...` |
| `ALLOWED_ORIGINS` | CORS origins | `http://localhost,http://mysite.com` |

## Troubleshooting

- **yt-dlp errors**: If using manual deployment, ensure `yt-dlp` is in your system PATH.
- **FFmpeg errors**: Ensure `ffmpeg` is installed and accessible for audio extraction.
- **Port Conflicts**: Ensure ports 80 and 3000 are not being used by other services.
