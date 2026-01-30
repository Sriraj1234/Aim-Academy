'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useGeminiLive } from '@/hooks/useGeminiLive';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaStop, FaTimes } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi2';

export const LiveGuruWidget = () => {
    const { user } = useAuth();
    const {
        isConnected,
        isConnecting,
        connect,
        disconnect,
        sendAudioChunk,
        volume,
        isSpeaking,
        error
    } = useGeminiLive();

    const [showWidget, setShowWidget] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

    // Cleanup audio resources
    const cleanupAudio = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }
        if (sourceNodeRef.current) {
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        setIsRecording(false);
    }, []);

    // Start recording and streaming audio
    const startRecording = async () => {
        try {
            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });
            streamRef.current = stream;

            // Create audio context
            const audioCtx = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioCtx;

            // Load audio worklet for processing
            await audioCtx.audioWorklet.addModule('/gemini-audio-processor.js');

            const source = audioCtx.createMediaStreamSource(stream);
            sourceNodeRef.current = source;

            const workletNode = new AudioWorkletNode(audioCtx, 'gemini-audio-processor');
            workletNodeRef.current = workletNode;

            // Connect nodes
            source.connect(workletNode);
            workletNode.connect(audioCtx.destination);

            // Handle audio chunks from worklet
            workletNode.port.onmessage = (e) => {
                if (e.data.type === 'audioChunk') {
                    const floatData = new Float32Array(e.data.audio);

                    // Convert Float32 to Int16
                    const int16Data = new Int16Array(floatData.length);
                    for (let i = 0; i < floatData.length; i++) {
                        const val = Math.max(-1, Math.min(1, floatData[i]));
                        int16Data[i] = val < 0 ? val * 0x8000 : val * 0x7FFF;
                    }

                    sendAudioChunk(int16Data.buffer);
                }
            };

            setIsRecording(true);
        } catch (err) {
            console.error('Failed to start recording:', err);
        }
    };

    // Handle connect/disconnect
    const handleToggle = async () => {
        if (isConnected) {
            cleanupAudio();
            disconnect();
        } else {
            await connect();
            await startRecording();
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupAudio();
            disconnect();
        };
    }, [cleanupAudio, disconnect]);

    // Collapsed Widget Card
    if (!showWidget) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white text-center shadow-2xl overflow-hidden cursor-pointer w-full max-w-sm mx-auto border border-white/10 group"
                onClick={() => setShowWidget(true)}
            >
                {/* Animated Gradient Orbs */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-600/30 rounded-full blur-3xl group-hover:bg-violet-500/40 transition-colors duration-700" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-600/20 rounded-full blur-3xl group-hover:bg-cyan-500/30 transition-colors duration-700" />

                {/* Sparkle Icon */}
                <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-2xl rotate-6 opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-2xl -rotate-3" />
                    <HiSparkles className="relative text-4xl text-white z-10" />
                </div>

                <h3 className="text-2xl font-bold tracking-tight mb-1 text-white relative z-10">
                    Live Guru
                </h3>
                <p className="text-slate-400 text-sm font-medium mb-6 relative z-10">
                    AI Voice Tutor
                </p>

                <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500 bg-slate-800/50 py-2.5 px-4 rounded-full border border-slate-700/50 relative z-10">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>Ready to talk</span>
                </div>
            </motion.div>
        );
    }

    // Expanded Full-Screen Interface
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-[100] flex flex-col bg-slate-950 font-sans"
            >
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-violet-900/20 via-transparent to-transparent blur-3xl" />
                    <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-gradient-to-t from-slate-900 to-transparent" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
                </div>

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between px-6 py-5 safe-area-top">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isConnected ? 'bg-gradient-to-br from-violet-500 to-cyan-500' : 'bg-slate-800'}`}>
                            <HiSparkles className="text-xl text-white" />
                        </div>
                        <div>
                            <h1 className="text-white font-semibold text-lg">Live Guru</h1>
                            <p className="text-slate-500 text-xs">
                                {isConnecting ? 'Connecting...' : isConnected ? 'Session Active' : 'Ready'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => { cleanupAudio(); disconnect(); setShowWidget(false); }}
                        className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-slate-700/50"
                    >
                        <FaTimes size={14} />
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mx-6 mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">

                    {/* Central Visualizer Orb */}
                    <div className="relative mb-8">
                        {/* Outer Glow Rings */}
                        {isConnected && (
                            <>
                                <motion.div
                                    className={`absolute inset-0 rounded-full blur-2xl ${isSpeaking ? 'bg-violet-500/30' : 'bg-cyan-500/20'}`}
                                    animate={{
                                        scale: isSpeaking ? [1, 1.3, 1] : [1, 1.1, 1],
                                        opacity: [0.3, 0.5, 0.3]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                />
                                <motion.div
                                    className="absolute inset-[-20px] rounded-full border border-white/5"
                                    animate={{ scale: [1, 1.2], opacity: [0.3, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                                />
                            </>
                        )}

                        {/* Main Orb */}
                        <motion.div
                            className={`relative w-40 h-40 md:w-48 md:h-48 rounded-full flex items-center justify-center transition-all duration-500
                                ${isSpeaking
                                    ? 'bg-gradient-to-br from-violet-500 via-purple-600 to-violet-700 shadow-2xl shadow-violet-500/30'
                                    : isConnected
                                        ? 'bg-gradient-to-br from-cyan-500 via-teal-500 to-cyan-600 shadow-2xl shadow-cyan-500/20'
                                        : 'bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50'
                                }`}
                            animate={isConnected ? {
                                scale: isSpeaking ? [1, 1.05, 1] : [1, 1.02, 1]
                            } : {}}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            {/* Inner Glow */}
                            <div className={`absolute inset-4 rounded-full bg-gradient-to-t from-transparent ${isSpeaking ? 'to-white/20' : 'to-white/10'}`} />

                            {/* Sound Wave Bars */}
                            {isConnected && (
                                <div className="flex items-center justify-center gap-1.5">
                                    {[...Array(5)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="w-1.5 bg-white/90 rounded-full"
                                            animate={isSpeaking ? {
                                                height: [8 + i * 4, 24 + Math.sin(i) * 12, 8 + i * 4]
                                            } : {
                                                height: Math.max(6, 6 + (volume * 60 * (Math.sin(i * 0.8) + 1.2)))
                                            }}
                                            transition={isSpeaking ? {
                                                duration: 0.4 + (i * 0.05),
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            } : {
                                                type: "spring",
                                                stiffness: 500,
                                                damping: 20
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Idle State Icon */}
                            {!isConnected && (
                                <FaMicrophone className="text-4xl text-slate-400" />
                            )}
                        </motion.div>
                    </div>

                    {/* Status Text */}
                    <div className="text-center space-y-2">
                        <motion.h2
                            key={isSpeaking ? 'speak' : isConnected ? 'listen' : 'wait'}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-2xl md:text-3xl font-bold text-white"
                        >
                            {isConnecting ? 'Connecting...' :
                                isSpeaking ? 'Live Guru is Speaking' :
                                    isConnected ? 'Listening...' :
                                        'Tap to Start'}
                        </motion.h2>

                        {!isConnected && (
                            <p className="text-slate-500 text-sm max-w-xs mx-auto">
                                Press the button below to start a voice conversation
                            </p>
                        )}
                    </div>
                </div>

                {/* Bottom Control Bar */}
                <div className="relative z-10 w-full bg-slate-900/80 backdrop-blur-2xl border-t border-slate-800 pb-8 pt-6 px-6 safe-area-bottom">
                    <div className="flex items-center justify-center max-w-md mx-auto">

                        {/* Main Action Button */}
                        <motion.button
                            onClick={handleToggle}
                            disabled={isConnecting}
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.05 }}
                            className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-3xl transition-all shadow-2xl relative overflow-hidden
                                ${isConnected
                                    ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30'
                                    : isConnecting
                                        ? 'bg-slate-700 cursor-wait'
                                        : 'bg-gradient-to-br from-violet-500 to-violet-600 shadow-violet-500/30 hover:shadow-violet-500/50'
                                }`}
                        >
                            {/* Button Glow */}
                            <div className={`absolute inset-0 rounded-full ${isConnected ? 'bg-red-400' : 'bg-violet-400'} blur-xl opacity-30`} />

                            <span className="relative z-10 text-white">
                                {isConnecting ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : isConnected ? (
                                    <FaStop />
                                ) : (
                                    <FaMicrophone />
                                )}
                            </span>
                        </motion.button>

                    </div>
                    <p className="text-center text-slate-600 text-xs mt-4 font-medium">
                        {isConnecting ? 'Please wait...' : isConnected ? 'Tap to end session' : 'Tap to start talking'}
                    </p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default LiveGuruWidget;
