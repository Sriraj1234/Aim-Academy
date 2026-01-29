'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { useGeminiLive } from '@/hooks/useGeminiLive';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaStop, FaTimes, FaWaveSquare, FaVolumeUp } from 'react-icons/fa';
import Image from 'next/image';

export const LiveGuruWidget = () => {
    const { userProfile } = useAuth();
    const {
        isConnected,
        isConnecting,
        connect,
        disconnect,
        volume,
        isAiSpeaking,
        messages,
        currentTranscript
    } = useGeminiLive({ userProfile });
    const [showWidget, setShowWidget] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Get current avatar based on state
    const getCurrentAvatar = useMemo(() => {
        if (isAiSpeaking) return '/images/saraswati-speaking.png';
        if (isConnected) return '/images/saraswati-listening.png';
        return '/images/saraswati-idle.png';
    }, [isConnected, isAiSpeaking]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, currentTranscript]);

    // Collapsed Widget Card (Professional Glass Card)
    if (!showWidget) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 text-white text-center shadow-2xl relative overflow-hidden group cursor-pointer w-full max-w-sm mx-auto"
                onClick={() => setShowWidget(true)}
            >
                {/* Abstract Background Art */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-pink-600/20" />
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-500/30 rounded-full blur-3xl" />

                {/* Avatar with Ring */}
                <div className="relative w-24 h-24 mx-auto mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur opacity-40 animate-pulse" />
                    <Image
                        src="/images/saraswati-idle.png"
                        alt="Saraswati Devi"
                        width={96}
                        height={96}
                        className="relative rounded-full border-[3px] border-white/30 shadow-2xl object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white shadow-sm" />
                </div>

                <h3 className="text-2xl font-bold font-sans tracking-tight mb-0.5 text-white">
                    सरस्वती
                </h3>
                <p className="text-purple-200 text-sm font-medium tracking-wide uppercase opacity-80 mb-4">AI Personal Tutor</p>

                <div className="flex items-center justify-center gap-2 text-xs font-medium text-white/50 bg-white/5 py-2 rounded-xl border border-white/5">
                    <FaWaveSquare className="text-purple-400" />
                    <span>Always listening • 24/7 Support</span>
                </div>
            </motion.div>
        );
    }

    // Expanded Full-Screen Professional Interface
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-[100] flex flex-col bg-[#050511] font-sans"
            >
                {/* Ambient Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-900/10 rounded-full blur-[100px]" />
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03]" /> {/* Optional noise texture */}
                </div>

                {/* Header: Status Bar */}
                <div className="relative z-10 flex items-center justify-between px-6 py-6 safe-area-top">
                    <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                        <span className="text-xs font-medium text-white/70 tracking-wide uppercase">
                            {isConnecting ? 'CONNECTING...' : isConnected ? 'LIVE SESSION' : 'READY'}
                        </span>
                    </div>

                    <button
                        onClick={() => { disconnect(); setShowWidget(false); }}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                    >
                        <FaTimes size={14} />
                    </button>
                </div>

                {/* Main Visualizer Area */}
                <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">

                    {/* Central Avatar Visualizer */}
                    <div className="relative mb-12">
                        {/* Audio Waveform/Glow Effects */}
                        {isConnected && (
                            <>
                                {/* Large ambient pulse */}
                                <motion.div
                                    className={`absolute inset-0 rounded-full blur-3xl opacity-30 transition-colors duration-500 ${isAiSpeaking ? 'bg-pink-600' : 'bg-purple-600'}`}
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                />

                                {/* Dynamic Ripples */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <motion.div
                                        className={`absolute w-full h-full rounded-full border border-white/10`}
                                        animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                                    />
                                    <motion.div
                                        className={`absolute w-full h-full rounded-full border border-white/5`}
                                        animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: "easeOut" }}
                                    />
                                </div>
                            </>
                        )}

                        {/* Avatar Container */}
                        <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full p-2">
                            {/* Gradient Border Ring */}
                            <div className={`absolute inset-0 rounded-full bg-gradient-to-tr transition-all duration-500 p-[2px] 
                                ${isAiSpeaking ? 'from-pink-500 via-purple-500 to-indigo-500 shadow-xl shadow-pink-500/20' :
                                    isConnected ? 'from-green-400 via-emerald-500 to-teal-500 shadow-xl shadow-green-500/20' :
                                        'from-white/20 to-white/5'}`}
                            >
                                <div className="w-full h-full rounded-full bg-[#050511] flex items-center justify-center overflow-hidden relative">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={getCurrentAvatar}
                                            initial={{ opacity: 0, scale: 1.1 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.4 }}
                                            className="w-full h-full"
                                        >
                                            <Image
                                                src={getCurrentAvatar}
                                                alt="Saraswati"
                                                fill
                                                className="object-cover"
                                                priority
                                            />
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* Animated Sound Wave Visualizer */}
                        {isConnected && (
                            <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 h-6">
                                {[...Array(5)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className={`w-1 rounded-full ${isAiSpeaking
                                            ? 'bg-gradient-to-t from-pink-500 to-purple-400'
                                            : 'bg-gradient-to-t from-green-400 to-emerald-300'
                                            }`}
                                        animate={isAiSpeaking ? {
                                            // AI Speaking - smooth wave (smaller heights)
                                            height: [
                                                4 + Math.sin(i * 0.5) * 4,
                                                12 + Math.sin(i * 0.8) * 6,
                                                8 + Math.cos(i * 0.6) * 4,
                                                16 + Math.sin(i * 0.7) * 4,
                                                4 + Math.sin(i * 0.5) * 4
                                            ]
                                        } : {
                                            // User Speaking - volume reactive (smaller)
                                            height: Math.max(4, 4 + (volume * 80 * (Math.sin(i * 0.8) + 1.2)))
                                        }}
                                        transition={isAiSpeaking ? {
                                            duration: 0.6 + (i * 0.08),
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        } : {
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 15
                                        }}
                                        style={{
                                            boxShadow: isAiSpeaking
                                                ? '0 0 6px rgba(236, 72, 153, 0.4)'
                                                : '0 0 5px rgba(52, 211, 153, 0.3)'
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Interaction Status */}
                    <div className="text-center space-y-2">
                        <motion.h2
                            key={isAiSpeaking ? 'speak' : isConnected ? 'listen' : 'wait'}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-white"
                        >
                            {isConnecting ? 'Connecting...' :
                                isAiSpeaking ? 'Saraswati is speaking' :
                                    isConnected ? 'Listening to you' :
                                        'Tap to Start'}
                        </motion.h2>

                        {!isConnected && (
                            <p className="text-white/40 text-sm max-w-xs mx-auto leading-relaxed">
                                "Ask me anything about your studies. I am here to help."
                            </p>
                        )}
                    </div>
                </div>

                {/* Floating Transcription Card */}
                {messages.length > 0 && (
                    <div className="relative z-10 w-full max-w-lg mx-auto px-6 mb-8">
                        <div
                            ref={chatContainerRef}
                            className="max-h-40 overflow-y-auto w-full backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 shadow-2xl mask-fade-top"
                        >
                            {messages.map((msg, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={i}
                                    className={`flex gap-3 mb-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed max-w-[85%] ${msg.role === 'user'
                                        ? 'bg-purple-600 text-white rounded-br-none shadow-lg shadow-purple-900/20'
                                        : 'bg-white/10 text-purple-100 rounded-bl-none border border-white/5'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Control Deck */}
                <div className="relative z-10 w-full bg-white/5 backdrop-blur-2xl border-t border-white/10 pb-8 pt-6 px-6 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] safe-area-bottom">
                    <div className="flex items-center justify-center gap-8 md:gap-12 max-w-md mx-auto">

                        {/* Secondary Actions (Placeholder for now) */}
                        <button className="w-12 h-12 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors">
                            <FaVolumeUp size={18} />
                        </button>

                        {/* Main Action Trigger */}
                        <motion.button
                            onClick={isConnected ? disconnect : connect}
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.05 }}
                            className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-3xl transition-all shadow-2xl relative group
                                ${isConnected
                                    ? 'bg-gradient-to-br from-red-500 to-pink-600 shadow-red-500/40 border-4 border-white/10'
                                    : 'bg-gradient-to-br from-white to-purple-50 shadow-white/20 border-4 border-purple-500/30'
                                }`}
                        >
                            {/* Button inner glow */}
                            <div className={`absolute inset-0 rounded-full blur-xl opacity-50 ${isConnected ? 'bg-red-500' : 'bg-white'}`} />

                            <span className={`relative z-10 ${isConnected ? 'text-white' : 'text-purple-900'}`}>
                                {isConnected ? <FaStop className="ml-0.5" /> : <FaMicrophone />}
                            </span>
                        </motion.button>

                        <button className="w-12 h-12 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors">
                            <FaWaveSquare size={18} />
                        </button>

                    </div>
                    <p className="text-center text-white/30 text-[10px] mt-6 tracking-widest uppercase font-semibold">
                        {isConnected ? 'Tap to End Session' : 'Tap to Speak'}
                    </p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
