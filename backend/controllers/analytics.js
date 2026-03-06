import Download from '../models/download.js';

export const getStats = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Total Downloads
        const totalDownloads = await Download.countDocuments({ userId });

        // 2. File Type Distribution (Video vs Audio)
        const typeDistribution = await Download.aggregate([
            { $match: { userId } },
            { $group: { _id: '$fileType', count: { $sum: 1 } } }
        ]);

        // 3. Downloads by Domain (YouTube, TikTok, etc.)
        const downloads = await Download.find({ userId }).select('originalVideoUrl');
        const domainStats = {};
        downloads.forEach(d => {
            try {
                const domain = new URL(d.originalVideoUrl).hostname.replace('www.', '');
                domainStats[domain] = (domainStats[domain] || 0) + 1;
            } catch (e) {
                domainStats['other'] = (domainStats['other'] || 0) + 1;
            }
        });

        const formattedDomainStats = Object.keys(domainStats).map(domain => ({
            name: domain,
            value: domainStats[domain]
        }));

        // 4. Activity Trends (Daily downloads for the last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyTrends = await Download.aggregate([
            {
                $match: {
                    userId,
                    downloadedAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$downloadedAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.status(200).json({
            success: true,
            stats: {
                totalDownloads,
                typeDistribution: typeDistribution.map(t => ({ name: t._id, value: t.count })),
                domainStats: formattedDomainStats,
                dailyTrends: dailyTrends.map(t => ({ date: t._id, count: t.count }))
            }
        });
    } catch (error) {
        console.error('Analytics stats error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching analytics' });
    }
};
