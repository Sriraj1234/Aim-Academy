'use client';

import { useState, useEffect } from 'react';
import { useGeminiLive } from '@/hooks/useGeminiLive';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaStop, FaBolt } from 'react-icons/fa';

export const LiveGuruWidget = () => {
    const { isConnected, isConnecting, connect, disconnect, volume, isAiSpeaking } = useGeminiLive();
    const [showWidget, setShowWidget] = useState(false);

    // Orb Animation Variants
    const orbVariants = {
        idle: { scale: 1, opacity: 0.5, boxShadow: "0px 0px 20px 5px rgba(124, 58, 237, 0.3)" },
        speaking: {
            scale: [1, 1.2, 1],
            opacity: 1,
            boxShadow: [
                "0px 0px 20px 5px rgba(124, 58, 237, 0.5)",
                "0px 0px 40px 10px rgba(139, 92, 246, 0.8)",
                "0px 0px 20px 5px rgba(124, 58, 237, 0.5)"
            ],
            transition: { repeat: Infinity, duration: 1.5 }
        },
        listening: {
            scale: [1, 1.05, 1],
            opacity: 0.8,
            boxShadow: "0px 0px 30px 5px rgba(16, 185, 129, 0.4)", // Greenish for listening
            transition: { repeat: Infinity, duration: 2 }
        }
    };

    if (!showWidget) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-indigo-900 to-violet-900 rounded-[2rem] p-6 text-white text-center shadow-xl border border-white/10 relative overflow-hidden group cursor-pointer"
                onClick={() => setShowWidget(true)}
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />

                <div className="w-16 h-16 rounded-full bg-white/20 mx-auto flex items-center justify-center mb-4 backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform">
                    <FaBolt className="text-3xl text-yellow-300" />
                </div>
                <h3 className="text-xl font-bold font-display mb-1">Live Guru</h3>
                <p className="text-indigo-200 text-sm">Talk to Sri Raj (AI Tutor)</p>
            </motion.div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            >
                <div className="bg-gray-900 w-full max-w-md rounded-[3rem] p-8 relative overflow-hidden border border-white/10 shadow-2xl flex flex-col items-center">

                    {/* Close Button */}
                    <button
                        onClick={() => { disconnect(); setShowWidget(false); }}
                        className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                    >
                        Close
                    </button>

                    {/* Header */}
                    <div className="text-center mb-10 mt-4">
                        <h2 className="text-2xl font-bold text-white mb-2">Sri Raj AI</h2>
                        <p className="text-indigo-400 text-sm font-medium tracking-wide uppercase">Live 1:1 Session</p>
                    </div>

                    {/* The ORB */}
                    <div className="relative w-64 h-64 flex items-center justify-center mb-12">
                        {/* Core Orb */}
                        <motion.div
                            className={`w-32 h-32 rounded-full ${isAiSpeaking ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500' : 'bg-gradient-to-br from-indigo-500 to-blue-500'}`}
                            variants={orbVariants}
                            animate={isAiSpeaking ? "speaking" : (isConnected ? "listening" : "idle")}
                        />

                        {/* Rings */}
                        {isConnected && (
                            <>
                                <motion.div
                                    className="absolute inset-0 border border-white/10 rounded-full"
                                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                                />
                                <motion.div
                                    className="absolute inset-0 border border-white/5 rounded-full"
                                    animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                                    transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: "easeOut" }}
                                />
                            </>
                        )}
                    </div>

                    {/* Status Text */}
                    <div className="h-8 mb-8 text-center">
                        {isConnecting ? (
                            <p className="text-gray-400 animate-pulse">Connecting to Satelite...</p>
                        ) : isAiSpeaking ? (
                            <p className="text-violet-300 font-bold">Sri Raj is speaking...</p>
                        ) : isConnected ? (
                            <p className="text-green-400 font-bold">Listening...</p>
                        ) : (
                            <p className="text-gray-500">Tap Mic to Start</p>
                        )}
                    </div>

                    {/* Controls */}
                    <button
                        onClick={isConnected ? disconnect : connect}
                        className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl transition-all shadow-lg hover:scale-105 active:scale-95
                            ${isConnected
                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                                : 'bg-white hover:bg-gray-100 text-indigo-600 shadow-white/20'
                            }`}
                    >
                        {isConnected ? <FaStop /> : <FaMicrophone />}
                    </button>

                </div>
            </motion.div>
        </AnimatePresence>
    );
};
