'use client';

import { useState, useRef, useEffect } from 'react';
import { useGeminiLive } from '@/hooks/useGeminiLive';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaStop, FaTimes } from 'react-icons/fa';
import Image from 'next/image';

interface ChatMessage {
    role: 'user' | 'guru';
    text: string;
    timestamp: Date;
}

export const LiveGuruWidget = () => {
    const { isConnected, isConnecting, connect, disconnect, volume, isAiSpeaking } = useGeminiLive();
    const [showWidget, setShowWidget] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    // Orb Animation Variants
    const orbVariants = {
        idle: {
            scale: 1,
            opacity: 0.6,
        },
        speaking: {
            scale: [1, 1.15, 1],
            opacity: 1,
            transition: { repeat: Infinity, duration: 1.2 }
        },
        listening: {
            scale: [1, 1.05, 1],
            opacity: 0.9,
            transition: { repeat: Infinity, duration: 2 }
        }
    };

    // Collapsed Widget Card
    if (!showWidget) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-purple-900/90 via-indigo-900/80 to-violet-900/70 rounded-3xl p-6 text-white text-center shadow-2xl border border-purple-400/30 relative overflow-hidden group cursor-pointer backdrop-blur-sm"
                onClick={() => setShowWidget(true)}
            >
                {/* Decorative ॐ Background */}
                <div className="absolute inset-0 opacity-5 text-[200px] font-bold flex items-center justify-center pointer-events-none">
                    ॐ
                </div>

                {/* Glow Effect */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-pink-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-indigo-400/20 to-purple-500/10 rounded-full blur-2xl -ml-10 -mb-10" />

                {/* Avatar */}
                <div className="relative w-20 h-20 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-md opacity-50" />
                    <Image
                        src="/images/guru-avatar.png"
                        alt="Saraswati Devi"
                        width={80}
                        height={80}
                        className="relative rounded-full border-2 border-purple-400/50 shadow-lg"
                    />
                </div>

                <h3 className="text-2xl font-bold font-display mb-1 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
                    सरस्वती
                </h3>
                <p className="text-purple-200/80 text-sm font-medium">Saraswati • AI Tutor</p>
                <p className="text-purple-300/60 text-xs mt-2">🎙️ Tap to start voice session</p>
            </motion.div>
        );
    }

    // Expanded Full-Screen Modal
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-gray-900 via-purple-950 to-black"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/50 backdrop-blur-md safe-area-top">
                    <div className="flex items-center gap-3">
                        <Image
                            src="/images/guru-avatar.png"
                            alt="Saraswati Devi"
                            width={40}
                            height={40}
                            className="rounded-full border border-purple-500/50"
                        />
                        <div>
                            <h2 className="text-lg font-bold text-white">सरस्वती</h2>
                            <p className="text-xs text-purple-400">
                                {isConnecting ? '🔄 Connecting...' : isConnected ? (isAiSpeaking ? '🗣️ Speaking...' : '👂 Listening...') : '⏸️ Ready'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => { disconnect(); setShowWidget(false); }}
                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 relative overflow-hidden">
                    {/* Decorative ॐ Background */}
                    <div className="absolute inset-0 opacity-[0.02] text-[400px] font-bold flex items-center justify-center pointer-events-none select-none">
                        ॐ
                    </div>

                    {/* The Orb with Avatar */}
                    <div className="relative flex items-center justify-center mb-8">
                        {/* Outer Glow Rings */}
                        {isConnected && (
                            <>
                                <motion.div
                                    className="absolute w-48 h-48 rounded-full border border-purple-500/20"
                                    animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                                />
                                <motion.div
                                    className="absolute w-48 h-48 rounded-full border border-purple-500/10"
                                    animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                                    transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: "easeOut" }}
                                />
                            </>
                        )}

                        {/* Core Orb */}
                        <motion.div
                            variants={orbVariants}
                            animate={isAiSpeaking ? "speaking" : (isConnected ? "listening" : "idle")}
                            className={`relative w-36 h-36 md:w-44 md:h-44 rounded-full flex items-center justify-center
                                ${isAiSpeaking
                                    ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-fuchsia-500 shadow-[0_0_60px_rgba(168,85,247,0.5)]'
                                    : isConnected
                                        ? 'bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 shadow-[0_0_40px_rgba(168,85,247,0.3)]'
                                        : 'bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 shadow-[0_0_20px_rgba(0,0,0,0.5)]'
                                }`}
                        >
                            <Image
                                src="/images/guru-avatar.png"
                                alt="Saraswati Devi"
                                width={120}
                                height={120}
                                className="rounded-full border-4 border-white/20"
                            />
                        </motion.div>

                        {/* Volume Indicator */}
                        {isConnected && !isAiSpeaking && (
                            <motion.div
                                className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                            >
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1.5 rounded-full bg-green-400 transition-all duration-100`}
                                        style={{ height: `${Math.min(20, 4 + (volume * 100 * (i + 1) / 3))}px` }}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </div>

                    {/* Status Text */}
                    <div className="text-center mb-6">
                        <p className="text-xl font-bold text-white mb-1">
                            {isConnecting ? 'संयोजन हो रहा है...' :
                                isAiSpeaking ? 'सरस्वती बोल रही हैं...' :
                                    isConnected ? 'सुन रही हूं...' :
                                        'बोलने के लिए टैप करें'}
                        </p>
                        <p className="text-sm text-gray-400">
                            {isConnecting ? 'Connecting to Saraswati...' :
                                isAiSpeaking ? 'Saraswati is speaking...' :
                                    isConnected ? 'Listening to you...' :
                                        'Tap mic to start'}
                        </p>
                    </div>

                    {/* Sanskrit Quote */}
                    <div className="text-center px-6 py-3 bg-white/5 rounded-2xl border border-white/10 mb-6 max-w-sm">
                        <p className="text-purple-300/80 text-sm italic">
                            "या कुन्देन्दुतुषारहारधवला"
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                            Goddess Saraswati Prayer
                        </p>
                    </div>
                </div>

                {/* Chat Transcript (Scrollable) */}
                {chatMessages.length > 0 && (
                    <div
                        ref={chatContainerRef}
                        className="max-h-32 overflow-y-auto px-4 py-2 border-t border-white/10 bg-black/30"
                    >
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex gap-2 mb-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`px-3 py-2 rounded-2xl text-sm max-w-[80%] ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-purple-900/50 text-purple-100'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Bottom Controls */}
                <div className="px-4 py-6 border-t border-white/10 bg-black/50 backdrop-blur-md safe-area-bottom">
                    <div className="flex items-center justify-center gap-6">
                        {/* Main Mic Button */}
                        <motion.button
                            onClick={isConnected ? disconnect : connect}
                            whileTap={{ scale: 0.9 }}
                            className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-3xl transition-all shadow-2xl
                                ${isConnected
                                    ? 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-red-500/40'
                                    : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-purple-500/40'
                                }`}
                        >
                            {isConnected ? <FaStop /> : <FaMicrophone />}
                        </motion.button>
                    </div>

                    {/* Tip Text */}
                    <p className="text-center text-gray-500 text-xs mt-4">
                        {isConnected ? 'Tap to end session' : 'Tap mic to start talking with Saraswati'}
                    </p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
