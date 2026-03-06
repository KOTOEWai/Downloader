import React, { useEffect, useState } from 'react';
import api from '../api';
import { motion } from 'framer-motion';
import {
    FiDownload,
    FiMusic,
    FiVideo,
    FiActivity,
    FiGlobe,
    FiArrowLeft
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

interface Stats {
    totalDownloads: number;
    typeDistribution: { name: string, value: number }[];
    domainStats: { name: string, value: number }[];
    dailyTrends: { date: string, count: number }[];
}

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/analytics/stats');
                if (res.data.success) {
                    setStats(res.data.stats);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    const videoCount = stats?.typeDistribution.find(t => t.name === 'video')?.value || 0;
    const audioCount = stats?.typeDistribution.find(t => t.name === 'audio')?.value || 0;

    return (
        <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <motion.button
                        whileHover={{ x: -5 }}
                        onClick={() => navigate('/home')}
                        className="flex items-center text-text-dim hover:text-text-main transition-colors mb-4"
                    >
                        <FiArrowLeft className="mr-2" /> Back to Home
                    </motion.button>
                    <h1 className="text-4xl font-bold text-text-main tracking-tight">Analytics Dashboard</h1>
                    <p className="text-text-dim">Insights into your downloading activity</p>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'Total Downloads', value: stats?.totalDownloads, icon: <FiDownload />, color: 'from-blue-500 to-indigo-600' },
                    { label: 'Video Files', value: videoCount, icon: <FiVideo />, color: 'from-purple-500 to-pink-600' },
                    { label: 'Audio Files', value: audioCount, icon: <FiMusic />, color: 'from-amber-500 to-orange-600' },
                    { label: 'Active Days', value: stats?.dailyTrends.length, icon: <FiActivity />, color: 'from-emerald-500 to-teal-600' },
                ].map((kpi, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={kpi.label}
                        className="glass p-6 border border-white/10"
                    >
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${kpi.color} w-fit mb-4 text-white text-2xl shadow-lg`}>
                            {kpi.icon}
                        </div>
                        <h3 className="text-text-dim text-sm font-medium uppercase tracking-wider">{kpi.label}</h3>
                        <p className="text-3xl font-bold text-text-main mt-1">{kpi.value || 0}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Domain Distribution */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass p-8 border border-white/10"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-text-main flex items-center">
                            <FiGlobe className="mr-2 text-primary" /> Top Source Domains
                        </h2>
                    </div>
                    <div className="space-y-4">
                        {stats?.domainStats.map((domain, i) => (
                            <div key={domain.name} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-main font-medium capitalize">{domain.name}</span>
                                    <span className="text-text-dim">{domain.value} downloads</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(domain.value / stats.totalDownloads) * 100}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                    />
                                </div>
                            </div>
                        ))}
                        {(!stats?.domainStats || stats.domainStats.length === 0) && (
                            <p className="text-text-dim text-center py-10 italic">No data available yet</p>
                        )}
                    </div>
                </motion.div>

                {/* Daily Activity Stats */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="glass p-8 border border-white/10"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-text-main flex items-center">
                            <FiActivity className="mr-2 text-emerald-500" /> Recent Activity (Last 7 Days)
                        </h2>
                    </div>
                    <div className="flex flex-col justify-between h-[280px]">
                        <div className="flex items-end justify-between h-full gap-2 pt-4">
                            {stats?.dailyTrends.map((day, i) => (
                                <div key={day.date} className="flex-1 flex flex-col items-center group">
                                    <div className="relative w-full flex justify-center items-end h-[180px]">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(day.count / (Math.max(...stats.dailyTrends.map(t => t.count)) || 1)) * 100}%` }}
                                            transition={{ duration: 1, delay: i * 0.1 }}
                                            className="w-full max-w-[40px] bg-gradient-to-t from-primary to-secondary rounded-t-lg group-hover:brightness-125 transition-all cursor-pointer relative"
                                        >
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-bg-card text-text-main text-xs px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {day.count}
                                            </div>
                                        </motion.div>
                                    </div>
                                    <span className="text-[10px] text-text-dim mt-3 rotate-45 md:rotate-0">
                                        {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                                    </span>
                                </div>
                            ))}
                            {(!stats?.dailyTrends || stats.dailyTrends.length === 0) && (
                                <div className="w-full flex items-center justify-center p-10 text-text-dim italic">
                                    No recent download activity
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
