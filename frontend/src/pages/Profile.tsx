import React, { useEffect, useState } from 'react';

import api from '../api';
import { motion } from 'framer-motion';

interface User {
    username: string;
    email: string;
    createdAt: string;
}

const Profile: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/user/me');
                setUser(response.data.user);
            } catch (err: any) {
                setError('Failed to load profile.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [token]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 glass rounded-3xl text-center">
                <p className="text-red-400 font-medium">{error || 'User not found'}</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
        >
            <div className="glass rounded-3xl overflow-hidden relative">
                {/* Header Banner */}
                <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20 relative">
                    <div className="absolute -bottom-12 left-10 w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold text-black shadow-xl ring-4 ring-bg-deep transition-transform hover:scale-105">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                </div>

                <div className="pt-16 p-10 space-y-8">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-text-main">{user.username}</h1>
                        <p className="text-text-dim text-sm">Member since {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-primary/60">Email Address</label>
                            <p className="text-text-main font-medium">{user.email}</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-secondary/60">Account Type</label>
                            <p className="text-text-main font-medium">Premium Member</p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-text-main">Device Security</h3>
                                <p className="text-sm text-text-dim">Your account is active on this session.</p>
                            </div>
                            <button className="btn-secondary text-sm">Manage Sessions</button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Profile;
