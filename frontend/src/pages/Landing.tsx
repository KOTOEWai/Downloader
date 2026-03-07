import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import UserGuide from '../components/UserGuide';
import { SiYoutube, SiTiktok, SiFacebook, SiInstagram, SiTwitch } from 'react-icons/si';

const Landing: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto space-y-24">
            {/* Hero Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-8 py-20"
            >
                <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
                    Download Content <br />
                    <span className="text-gradient">Without Limits.</span>
                </h1>
                <p className="text-text-dim text-xl max-w-2xl mx-auto">
                    အမြန်ဆုံးနဲ့ အလွယ်ကူဆုံး ဗီဒီယို downloader။ YouTube, TikTok နဲ့ တခြား platform ပေါင်းစုံက ဗီဒီယိုတွေကို အရည်အသွေးအကောင်းဆုံးနဲ့ ရယူလိုက်ပါ။
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Link to="/register" className="btn-primary px-10 py-4 text-lg w-full sm:w-auto">
                        Get Started Free
                    </Link>
                    <Link to="/login" className="px-10 py-4 text-lg font-bold border border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 transition-all w-full sm:w-auto">
                        Login
                    </Link>
                </div>
            </motion.section>

            {/* User Guide Section */}
            <UserGuide completedSteps={document.cookie.includes('isLoggedIn=true') ? [0] : []} />

            {/* Trust & Platforms Section */}
            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="py-20 border-t border-white/5"
            >
                <div className="text-center space-y-12">
                    <h2 className="text-3xl font-bold text-text-dim uppercase tracking-[0.3em]">Supported Platforms</h2>
                    <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-60">
                        <SiYoutube className="text-5xl hover:text-[#FF0000] transition-colors" />
                        <SiTiktok className="text-5xl hover:text-white transition-colors" />
                        <SiFacebook className="text-5xl hover:text-[#1877F2] transition-colors" />
                        <SiInstagram className="text-5xl hover:text-[#E4405F] transition-colors" />
                        <SiTwitch className="text-5xl hover:text-[#9146FF] transition-colors" />
                    </div>
                </div>
            </motion.section>

            {/* Final CTA */}
            <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="glass p-12 md:p-20 rounded-[3rem] text-center space-y-8 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
                <h2 className="text-4xl md:text-5xl font-bold">စတင်အသုံးပြုဖို့ အဆင်သင့်ဖြစ်ပြီလား?</h2>
                <p className="text-text-dim text-lg">အခုပဲ အကောင့်ဖွင့်ပြီး သင်လိုချင်တဲ့ ဗီဒီယိုတွေကို သိမ်းဆည်းလိုက်ပါ။</p>
                <Link to="/register" className="btn-primary px-12 py-5 text-xl inline-block">
                    Create Account Now
                </Link>
            </motion.section>
        </div>
    );
};

export default Landing;
