import cron from 'node-cron';
import { v2 as cloudinary } from 'cloudinary';
import Download from '../models/download.js';

export const startCleanupCronJob = () => {
    // Run every day at MN (0 0 * * *)
    // Deletes downloads older than 24 hours
    cron.schedule('0 0 * * *', async () => {
        console.log('🧹 Running auto-cleanup job for old downloads...');

        try {
            // 24 hours ago
            const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

            // Find old downloads using the 'downloadedAt' field
            const oldDownloads = await Download.find({ downloadedAt: { $lt: cutoffDate } });

            if (oldDownloads.length === 0) {
                console.log('✅ No old downloads to clean up.');
                return;
            }

            console.log(`🗑️ Found ${oldDownloads.length} old downloads to delete.`);

            // Delete from Cloudinary and DB
            for (const download of oldDownloads) {
                if (download.cloudinaryPublicId) {
                    try {
                        // Cloudinary expects resource_type: 'video' for both audio and video uploads in our app
                        await cloudinary.uploader.destroy(download.cloudinaryPublicId, { resource_type: 'video' });
                    } catch (cloudErr) {
                        console.error(`❌ Failed to delete from Cloudinary (${download.cloudinaryPublicId}):`, cloudErr);
                    }
                }
                await Download.findByIdAndDelete(download._id);
            }

            console.log('✅ Auto-cleanup completed successfully.');

        } catch (error) {
            console.error('❌ Error during auto-cleanup:', error);
        }
    });

    console.log('🕒 Auto-cleanup cron job initialized. Runs daily at midnight.');
};
