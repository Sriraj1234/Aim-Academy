'use client';

import { motion, Variants } from 'framer-motion';
import { FaBookOpen, FaLightbulb, FaRocket, FaStar } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

const QUOTES = [
    "Education is the most powerful weapon which you can use to change the world. 🌍",
    "The beautiful thing about learning is that no one can take it away from you. 🧠",
    "Success is the sum of small efforts, repeated day in and day out. 🏃‍♂️",
    "Don't let what you cannot do interfere with what you can do. ✨",
    "Expert in anything was once a beginner. Keep going! 🚀"
];

export const StudyHubBanner = () => {
    const { user } = useAuth();
    const [quote, setQuote] = useState(QUOTES[0]);

    useEffect(() => {
        // Random quote on mount
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    }, []);

    // Animation variants
    const containerVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    };

    const floatingVariant: Variants = {
        animate: {
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0],
            transition: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="mb-8 relative w-full overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 text-white shadow-2xl p-6 sm:p-10"
        >
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">

                {/* Text Content */}
                <div className="flex-1 text-center md:text-left space-y-3">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-indigo-100"
                    >
                        <FaRocket className="text-yellow-300" /> Study Mode On
                    </motion.div>

                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                        Welcome back, <br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">
                            {user?.displayName?.split(' ')[0] || 'Scholar'}!
                        </span> 👋
                    </h1>

                    <div className="max-w-xl bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 mt-4">
                        <div className="flex items-start gap-3">
                            <FaLightbulb className="text-yellow-300 text-xl flex-shrink-0 mt-1" />
                            <p className="text-sm sm:text-base font-medium text-indigo-50 italic">
                                "{quote}"
                            </p>
                        </div>
                    </div>
                </div>

                {/* Visual / Illustration Area */}
                <div className="relative w-full max-w-xs md:max-w-sm hidden sm:block">
                    {/* Floating Icons Composition */}
                    <div className="relative h-40 w-full flex items-center justify-center">
                        <motion.div
                            variants={floatingVariant}
                            animate="animate"
                            className="absolute z-20"
                        >
                            <div className="w-24 h-24 bg-gradient-to-tr from-white to-indigo-100 rounded-2xl shadow-xl flex items-center justify-center transform rotate-12 border-4 border-white/30 backdrop-blur-md">
                                <FaBookOpen className="text-5xl text-indigo-600" />
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 15, 0], rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                            className="absolute -right-4 -top-2 z-10"
                        >
                            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg border-4 border-white/20">
                                <FaStar className="text-3xl text-white" />
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute -left-2 bottom-0 z-0"
                        >
                            <div className="w-20 h-20 bg-purple-500/50 rounded-full blur-xl" />
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
