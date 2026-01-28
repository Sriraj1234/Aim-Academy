'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
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
    }, [chatMessages]);

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
                <div className="relative w-24 h-24 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-md opacity-50" />
                    <Image
                        src="/images/saraswati-idle.png"
                        alt="Saraswati Devi"
                        width={96}
                        height={96}
                        className="relative rounded-full border-2 border-purple-400/50 shadow-lg object-cover"
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
                        <motion.div
                            key={getCurrentAvatar}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Image
                                src={getCurrentAvatar}
                                alt="Saraswati Devi"
                                width={44}
                                height={44}
                                className="rounded-full border border-purple-500/50 object-cover"
                            />
                        </motion.div>
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

                    {/* The Orb with Animated Avatar */}
                    <div className="relative flex items-center justify-center mb-8">
                        {/* Outer Glow Rings */}
                        {isConnected && (
                            <>
                                <motion.div
                                    className={`absolute w-56 h-56 rounded-full border ${isAiSpeaking ? 'border-pink-500/30' : 'border-green-500/20'}`}
                                    animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                                />
                                <motion.div
                                    className={`absolute w-56 h-56 rounded-full border ${isAiSpeaking ? 'border-purple-500/20' : 'border-green-500/10'}`}
                                    animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                                    transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: "easeOut" }}
                                />
                            </>
                        )}

                        {/* Core Avatar Container */}
                        <motion.div
                            animate={isAiSpeaking ? {
                                scale: [1, 1.05, 1],
                                transition: { repeat: Infinity, duration: 0.8 }
                            } : isConnected ? {
                                scale: [1, 1.02, 1],
                                transition: { repeat: Infinity, duration: 2 }
                            } : {}}
                            className={`relative w-44 h-44 md:w-52 md:h-52 rounded-full flex items-center justify-center
                                ${isAiSpeaking
                                    ? 'shadow-[0_0_80px_rgba(168,85,247,0.6)]'
                                    : isConnected
                                        ? 'shadow-[0_0_60px_rgba(34,197,94,0.4)]'
                                        : 'shadow-[0_0_30px_rgba(168,85,247,0.2)]'
                                }`}
                        >
                            {/* Animated Avatar Image */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={getCurrentAvatar}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-full h-full"
                                >
                                    <Image
                                        src={getCurrentAvatar}
                                        alt="Saraswati Devi"
                                        width={208}
                                        height={208}
                                        className={`rounded-full border-4 object-cover w-full h-full
                                            ${isAiSpeaking
                                                ? 'border-pink-500/50'
                                                : isConnected
                                                    ? 'border-green-500/50'
                                                    : 'border-purple-500/30'}`}
                                    />
                                </motion.div>
                            </AnimatePresence>
                        </motion.div>

                        {/* Volume Indicator */}
                        {isConnected && !isAiSpeaking && (
                            <motion.div
                                className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1 bg-black/50 px-3 py-1 rounded-full"
                                animate={{ opacity: [0.6, 1, 0.6] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                            >
                                {[...Array(5)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="w-1.5 rounded-full bg-green-400"
                                        animate={{ height: [4, Math.min(20, 4 + (volume * 100 * (i + 1) / 3)), 4] }}
                                        transition={{ repeat: Infinity, duration: 0.3, delay: i * 0.05 }}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </div>

                    {/* Status Text */}
                    <div className="text-center mb-6">
                        <motion.p
                            key={isAiSpeaking ? 'speaking' : isConnected ? 'listening' : 'idle'}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-xl font-bold text-white mb-1"
                        >
                            {isConnecting ? 'संयोजन हो रहा है...' :
                                isAiSpeaking ? 'सरस्वती बोल रही हैं... 🗣️' :
                                    isConnected ? 'सुन रही हूं... 👂' :
                                        'बोलने के लिए टैप करें'}
                        </motion.p>
                        <p className="text-sm text-gray-400">
                            {isConnecting ? 'Connecting to Saraswati...' :
                                isAiSpeaking ? 'Saraswati is speaking...' :
                                    isConnected ? 'Listening to you...' :
                                        'Tap mic to start'}
                        </p>
                    </div>

                    {/* Sanskrit Quote */}
                    {!isConnected && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center px-6 py-3 bg-white/5 rounded-2xl border border-white/10 mb-6 max-w-sm"
                        >
                            <p className="text-purple-300/80 text-sm italic">
                                "या कुन्देन्दुतुषारहारधवला"
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                                Goddess Saraswati Prayer
                            </p>
                        </motion.div>
                    )}
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
                            whileHover={{ scale: 1.05 }}
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
