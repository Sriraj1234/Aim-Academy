'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaRobot, FaTimes, FaPaperPlane, FaSpinner,
    FaMicrophone, FaMicrophoneSlash,
    FaVolumeUp, FaVolumeMute
} from 'react-icons/fa';
import { HiSparkles, HiLightningBolt } from 'react-icons/hi';
import { useSpeech, isHindiText } from '@/hooks/useSpeech';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/context/AuthContext';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface AIChatWidgetProps {
    context?: {
        subject?: string;
        chapter?: string;
        class?: string;
    };
}

export const AIChatWidget: React.FC<AIChatWidgetProps> = ({ context }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [hasSpeechRecognition, setHasSpeechRecognition] = useState(false);
    const [streamingText, setStreamingText] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    // Hooks
    const { speak, stop, isSpeaking, isSupported: ttsSupported } = useSpeech();
    const { play } = useSound();
    const { userProfile } = useAuth(); // Get user profile

    // Determine effective context
    const effectiveContext = {
        ...context,
        class: context?.class || userProfile?.class,
        board: userProfile?.board,
        stream: userProfile?.stream,
        name: userProfile?.displayName // Pass user name
    };

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                setHasSpeechRecognition(true);
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = 'hi-IN';

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                recognitionRef.current.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setInput((prev: string) => prev + transcript);
                    setIsListening(false);
                };

                recognitionRef.current.onerror = () => setIsListening(false);
                recognitionRef.current.onend = () => setIsListening(false);
            }
        }
    }, []);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingText, loading]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const toggleVoice = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const speakMessage = (text: string) => {
        if (isSpeaking) {
            stop();
        } else {
            const lang = isHindiText(text) ? 'hi-IN' : 'en-IN';
            speak(text, lang);
        }
    };

    const sendMessage = useCallback(async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        setStreamingText('');
        play('click');

        try {
            const history = messages.slice(-6).map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                content: m.content
            }));

            // Use streaming
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    history,
                    context: effectiveContext,
                    stream: true,
                }),
            });

            if (response.headers.get('content-type')?.includes('text/event-stream')) {
                // Handle streaming response
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();
                let fullText = '';

                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n');

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6);
                                if (data === '[DONE]') break;

                                try {
                                    const parsed = JSON.parse(data);
                                    if (parsed.text) {
                                        fullText += parsed.text;
                                        setStreamingText(fullText);
                                    }
                                } catch {
                                    // Skip malformed JSON
                                }
                            }
                        }
                    }
                }

                // Add final message
                if (fullText) {
                    const botMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: fullText,
                        timestamp: new Date(),
                    };
                    setMessages(prev => [...prev, botMessage]);
                    setStreamingText('');
                    play('success');
                }
            } else {
                // Non-streaming fallback
                const data = await response.json();
                if (data.success) {
                    const botMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: data.reply,
                        timestamp: new Date(),
                    };
                    setMessages(prev => [...prev, botMessage]);
                    play('success');
                } else {
                    throw new Error(data.error);
                }
            }
        } catch {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Oops! Kuch problem ho gaya. Please try again! 🙏',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
            play('wrong');
        } finally {
            setLoading(false);
        }
    }, [input, loading, messages, context, play]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const quickPrompts = [
        'Study Tips do 📚',
        'Numericals kaise solve karun? 🧮',
        'Time Management batao ⏰',
    ];

    return (
        <>
            {/* Floating Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-[2rem] bg-pw-violet text-white shadow-pw-lg border-2 border-white flex items-center justify-center transform transition-all duration-300"
                    >
                        <FaRobot className="text-2xl" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                        <HiSparkles className="absolute -bottom-1 -left-1 text-yellow-400 text-lg animate-bounce" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm h-[70vh] max-h-[600px] bg-white rounded-[2rem] border border-pw-border shadow-pw-xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-pw-surface p-5 border-b border-pw-border flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-[1rem] bg-pw-violet text-white flex items-center justify-center relative shadow-pw-md">
                                    <FaRobot className="text-xl" />
                                    <HiLightningBolt className="absolute -top-1 -right-1 text-yellow-400 text-base" />
                                </div>
                                <div>
                                    <h3 className="font-display font-bold text-pw-violet text-lg flex items-center gap-2">
                                        AIM Buddy
                                    </h3>
                                    <p className="text-xs text-green-600 font-bold flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full inline-flex">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        Online & Ready
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 border border-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-red-500"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/50 scrollbar-thin scrollbar-thumb-gray-200">
                            {messages.length === 0 && (
                                <div className="text-center py-12 px-6">
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-[2rem] bg-pw-surface border-2 border-white shadow-pw-sm flex items-center justify-center relative">
                                        <FaRobot className="text-4xl text-pw-indigo" />
                                        <HiSparkles className="absolute -top-2 -right-2 text-2xl text-yellow-400" />
                                    </div>
                                    <h4 className="font-bold text-pw-violet text-lg mb-2">Hello Bachhon! 👋</h4>
                                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                        Main hoon aapka AIM Buddy! <br />
                                        Padhai mein koi bhi help chahiye?
                                    </p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {quickPrompts.map((q) => (
                                            <button
                                                key={q}
                                                onClick={() => setInput(q)}
                                                className="text-xs font-bold bg-white hover:bg-pw-surface hover:text-pw-indigo text-gray-600 border border-pw-border px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className="max-w-[85%] space-y-1">
                                        <div
                                            className={`px-5 py-3 rounded-[1.5rem] text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                                ? 'bg-pw-violet text-white rounded-br-md'
                                                : 'bg-white border border-pw-border text-gray-800 rounded-bl-md'
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                        {msg.role === 'assistant' && ttsSupported && (
                                            <button
                                                onClick={() => speakMessage(msg.content)}
                                                className="text-[10px] font-bold text-pw-indigo hover:text-pw-violet flex items-center gap-1 ml-2 px-2 py-1 bg-pw-surface rounded-full w-fit"
                                            >
                                                {isSpeaking ? <FaVolumeMute /> : <FaVolumeUp />}
                                                {isSpeaking ? 'Stop' : 'Listen'}
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Streaming indicator */}
                            {streamingText && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-white border border-pw-border px-5 py-3 rounded-[1.5rem] rounded-bl-md text-sm text-gray-800 max-w-[85%] shadow-sm">
                                        {streamingText}
                                        <span className="animate-pulse inline-block w-2 h-4 bg-pw-indigo ml-1 align-middle"></span>
                                    </div>
                                </motion.div>
                            )}

                            {loading && !streamingText && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-white border border-pw-border px-5 py-4 rounded-[1.5rem] rounded-bl-md flex items-center gap-3 shadow-sm">
                                        <FaSpinner className="text-pw-indigo animate-spin text-sm" />
                                        <span className="text-gray-500 text-xs font-bold">Thinking...</span>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-pw-border bg-white shrink-0">
                            <div className="flex items-center gap-3 bg-pw-surface p-2 rounded-[1.5rem] border border-pw-border shadow-inner">
                                {/* Voice Button */}
                                <button
                                    onClick={toggleVoice}
                                    disabled={!hasSpeechRecognition}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 shadow-sm ${isListening
                                        ? 'bg-red-500 text-white animate-pulse shadow-red-200'
                                        : 'bg-white text-gray-400 hover:text-pw-indigo hover:shadow-md'
                                        } ${!hasSpeechRecognition ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isListening ? <FaMicrophoneSlash className="text-sm" /> : <FaMicrophone className="text-sm" />}
                                </button>

                                {/* Text Input */}
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={isListening ? "Listening..." : "Poocho jo poochna hai..."}
                                    className="flex-1 bg-transparent border-none px-2 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-0 font-medium"
                                />

                                {/* Send Button */}
                                <button
                                    onClick={sendMessage}
                                    disabled={!input.trim() || loading}
                                    className="w-10 h-10 rounded-full bg-pw-indigo hover:bg-pw-violet text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-pw-md"
                                >
                                    <FaPaperPlane className="text-sm ml-0.5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
