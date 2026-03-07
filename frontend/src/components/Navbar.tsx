import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const isLoggedIn = document.cookie.includes('isLoggedIn=true');
    const { theme, toggleTheme } = useTheme();

    const handleLogout = async () => {
        try {
            await api.post('/user/logout');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            navigate('/login');
        }
    };

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-7xl z-50"
        >
            <div className="glass px-8 py-4 rounded-2xl flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-white dark:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-text-main to-text-dim">
                        Loader<span className="text-primary">X</span>
                    </span>
                </Link>

                <div className="flex items-center gap-4 sm:gap-6">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors group"
                        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                    >
                        {theme === 'light' ? (
                            <svg className="w-6 h-6 text-gray-600 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-yellow-400 group-hover:text-yellow-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        )}
                    </button>

                    {isLoggedIn ? (
                        <>
                            <Link to="/home" className="hidden sm:block text-sm font-medium text-text-dim hover:text-text-main transition-colors">Downloads</Link>
                            <Link to="/dashboard" className="hidden sm:block text-sm font-medium text-text-dim hover:text-text-main transition-colors">Analytics</Link>

                            <Link to="/profile" className="flex items-center gap-2 group">
                                <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-xs font-bold text-primary group-hover:bg-primary/10 transition-colors">
                                    U
                                </div>
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="btn-secondary px-4 py-2 text-sm border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-sm font-medium text-text-dim hover:text-text-main transition-colors">Login</Link>
                            <Link to="/register" className="btn-primary px-4 py-2 text-sm">Register</Link>
                        </>
                    )}
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;
