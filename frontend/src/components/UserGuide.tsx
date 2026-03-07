import React from 'react';
import { motion } from 'framer-motion';
import { FiUserPlus, FiCopy, FiLink, FiDownload, FiCheck } from 'react-icons/fi';

interface UserGuideProps {
    completedSteps?: number[];
}

const UserGuide: React.FC<UserGuideProps> = ({ completedSteps = [] }) => {
    const steps = [
        {
            step: "၀၁",
            title: "အကောင့်ဝင်ပါ",
            desc: "အကောင်းဆုံးဝန်ဆောင်မှုတွေရဖို့ Register/Login အရင်လုပ်ပါ။",
            icon: <FiUserPlus className="w-8 h-8 text-primary" />
        },
        {
            step: "၀၂",
            title: "Link ကူးပါ",
            desc: "သင်လိုချင်တဲ့ ဗီဒီယို Link ကို Browser ကနေ ကူးယူပါ။",
            icon: <FiCopy className="w-8 h-8 text-secondary" />
        },
        {
            step: "၀၃",
            title: "Link ထည့်ပါ",
            desc: "ဒီမှာ Paste လုပ်ပြီး Analyze ခလုတ်ကို နှိပ်ပါ။",
            icon: <FiLink className="w-8 h-8 text-primary" />
        },
        {
            step: "၀၄",
            title: "ရယူလိုက်ပါ",
            desc: "Quality ရွေးပြီး Download Now ကို နှိပ်ရုံပါပဲ။",
            icon: <FiDownload className="w-8 h-8 text-secondary" />
        }
    ];

    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-12 py-10"
        >
            <div className="text-center space-y-3">
                <h2 className="text-4xl font-bold tracking-tight">အသုံးပြုပုံ အဆင့်ဆင့်</h2>
                <p className="text-text-dim text-lg">VideoDownloader X ကို အသုံးပြုပြီး ဗီဒီယိုတွေ အလွယ်တကူ ရယူလိုက်ပါ</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {steps.map((item, i) => {
                    const isCompleted = completedSteps.includes(i);
                    return (
                        <div
                            key={i}
                            className={`glass p-8 rounded-3xl space-y-6 relative overflow-hidden group transition-all duration-300 border ${isCompleted ? 'border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'hover:border-primary/20'
                                }`}
                        >
                            <div className={`absolute -top-4 -right-4 text-7xl font-black transition-colors pointer-events-none ${isCompleted ? 'text-green-500/10' : 'text-white/5 group-hover:text-primary/10'
                                }`}>
                                {item.step}
                            </div>

                            <div className="flex items-center justify-between relative z-10">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border shadow-xl ${isCompleted ? 'bg-green-500/10 border-green-500/20' : 'bg-white/5 border-white/10'
                                    }`}>
                                    {item.icon}
                                </div>
                                {isCompleted && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                                    >
                                        <FiCheck className="text-white w-5 h-5 font-bold" />
                                    </motion.div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <h3 className={`text-xl font-bold transition-colors ${i === (completedSteps.length - (completedSteps.includes(i) ? 0 : 1)) && !isCompleted ? 'text-primary' : (isCompleted ? 'text-green-400' : 'text-text-main')}`}>
                                    {item.title}
                                </h3>
                                <p className="text-text-dim text-sm leading-relaxed">{item.desc}</p>
                            </div>

                            {isCompleted && (
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500" />
                            )}
                        </div>
                    );
                })}
            </div>
        </motion.section>
    );
};

export default UserGuide;
