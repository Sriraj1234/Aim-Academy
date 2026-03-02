'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaMicrophone, FaMicrophoneSlash, FaVolumeUp, FaVolumeMute, FaCamera, FaArrowLeft, FaTrash } from 'react-icons/fa';
import { useSpeech, isHindiText } from '@/hooks/useSpeech';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { SafeImage } from '@/components/shared/SafeImage';
import Link from 'next/link';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    images?: { title: string; image: string; url?: string; thumbnail?: string }[];
}

export default function AIChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [hasSpeechRecognition, setHasSpeechRecognition] = useState(false);
    const [streamingText, setStreamingText] = useState('');
    const [currentStatus, setCurrentStatus] = useState<string | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);

    const { speak, stop, isSpeaking, isSupported: ttsSupported } = useSpeech();
    const { play } = useSound();
    const { userProfile, checkAccess, incrementUsage } = useAuth();

    // Context formatting
    const effectiveContext = {
        class: userProfile?.class,
        board: userProfile?.board,
        stream: userProfile?.stream,
        name: userProfile?.displayName,
        weakSubjects: userProfile?.aiMemory?.weakSubjects || [],
        preferredLanguage: userProfile?.aiMemory?.preferences?.language || 'hinglish',
    };

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                setHasSpeechRecognition(true);
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = 'hi-IN';

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

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingText, loading]);

    // LocalStorage Persistence
    const getStorageKey = useCallback(() => {
        if (!userProfile?.uid) return null;
        return `aim_buddy_chat_history_fullpage_${userProfile.uid}`;
    }, [userProfile?.uid]);

    useEffect(() => {
        const key = getStorageKey();
        if (key) {
            const saved = localStorage.getItem(key);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    const hydrated = parsed.map((m: any) => ({
                        ...m,
                        timestamp: new Date(m.timestamp)
                    }));
                    setMessages(hydrated);
                } catch (e) {
                    console.error("Failed to load full page chat history", e);
                }
            }
        }
    }, [getStorageKey]);

    useEffect(() => {
        const key = getStorageKey();
        if (key && messages.length > 0) {
            localStorage.setItem(key, JSON.stringify(messages));
        }
    }, [messages, getStorageKey]);

    const handleClearChat = () => {
        if (window.confirm('Are you sure you want to clear your AI Tutor history?')) {
            const key = getStorageKey();
            if (key) localStorage.removeItem(key);
            setMessages([]);
            setInput('');
            stop();
            try { play('click'); } catch { }
        }
    };

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

    const processImage = async (file: File) => {
        setLoading(true);
        setCurrentStatus('searching_image');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const tempId = Date.now().toString();
            setMessages(prev => [...prev, {
                id: tempId,
                role: 'user',
                content: '📸 Sent an image to analyze...',
                timestamp: new Date()
            }]);

            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Upload failed');

            const lensUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(data.url)}`;
            window.open(lensUrl, '_blank');

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'I\'ve opened Google Lens to analyze your image! 🔍',
                timestamp: new Date()
            }]);

        } catch (error) {
            console.error('Lens error:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Failed to upload image. Please try again.',
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
            setCurrentStatus(null);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processImage(file);
        }
    };

    const sendMessage = useCallback(async () => {
        if (!input.trim() || loading) return;

        const hasAccess = checkAccess('ai_chat');
        if (!hasAccess) {
            setShowUpgradeModal(true);
            return;
        }

        const userMsg = input.trim();
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userMsg,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        setStreamingText('');
        try { play('click'); } catch { }

        incrementUsage('ai_chat');

        try {
            const history = messages.slice(-8).map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                content: m.content
            }));

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    history,
                    context: effectiveContext,
                    stream: true,
                }),
            });

            if (response.headers.get('content-type')?.includes('text/event-stream')) {
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();
                let fullText = '';
                let serverImages: any[] = [];

                if (reader) {
                    let buffer = '';
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || ''; // keep incomplete line in buffer

                        for (const line of lines) {
                            const trimmedLine = line.trim();
                            if (!trimmedLine.startsWith('data: ')) continue;

                            const data = trimmedLine.slice(6).trim();
                            if (data === '[DONE]') break;

                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.status) setCurrentStatus(parsed.status);
                                if (parsed.text) {
                                    fullText += parsed.text;
                                    setStreamingText(fullText);
                                    setCurrentStatus(null);
                                }
                                if (parsed.images) serverImages = parsed.images;
                            } catch {
                            }
                        }
                    }
                }

                if (fullText) {
                    const botMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: fullText,
                        timestamp: new Date(),
                        images: serverImages.length > 0 ? serverImages : undefined
                    };
                    setMessages(prev => [...prev, botMessage]);
                    setStreamingText('');
                    setCurrentStatus(null);
                    try { play('success'); } catch { }
                }
            } else {
                const data = await response.json();
                if (data.success) {
                    const botMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: data.reply,
                        timestamp: new Date(),
                        images: data.images
                    };
                    setMessages(prev => [...prev, botMessage]);
                    try { play('success'); } catch { }
                } else {
                    throw new Error(data.error);
                }
            }
        } catch (err) {
            console.error('Chat error:', err);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Oops! Connection issue:\n\`\`\`\n${(err as Error).message}\n\`\`\`\nPlease try asking again.`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
            try { play('wrong'); } catch { }
        } finally {
            setLoading(false);
            setTimeout(scrollToBottom, 100);
        }
    }, [input, loading, messages, effectiveContext, play, checkAccess, incrementUsage]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const quickPrompts = [
        'Explain quantum physics simply 🌌',
        'How to solve integration problems? 🧮',
        'Write an essay on modern technology ✍️',
        'Study plan for board exams 📅'
    ];

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 font-sans">
            <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} featureName="AI Tutor" />

            {/* Header */}
            <header className="flex-none bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/home" className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500">
                        <FaArrowLeft />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-indigo-100 shadow-sm overflow-hidden bg-white">
                            <img src={loading ? "/ai-avatar/teacher-thinking.png" : "/ai-avatar/teacher-idle.png"} alt="AI Core" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-800 dark:text-gray-100 leading-tight">AI Tutor</h1>
                            <span className="text-xs text-indigo-500 font-medium tracking-wide">Premium Study Assistant</span>
                        </div>
                    </div>
                </div>
                <button onClick={handleClearChat} className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors font-semibold">
                    <FaTrash className="text-[10px]" /> Clear History
                </button>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                <div className="max-w-4xl mx-auto space-y-6">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="w-24 h-24 mb-6 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-xl shadow-indigo-200 border-4 border-white flex items-center justify-center text-4xl text-white">
                                🧠
                            </motion.div>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-gray-100 mb-3">Hi {userProfile?.displayName ? userProfile.displayName.split(' ')[0] : 'there'}, I'm your AI Tutor</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">I can explain difficult concepts, solve numercal problems, structure essays, or build your custom study plan.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                                {quickPrompts.map(q => (
                                    <button onClick={() => setInput(q)} key={q} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:shadow-md p-4 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 transition-all text-left">
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start gap-4'}`}>
                            {msg.role === 'assistant' && (
                                <div className="w-10 h-10 rounded-full border border-gray-200 shadow-sm overflow-hidden shrink-0 mt-1 hidden sm:block">
                                    <img src="/ai-avatar/teacher-idle.png" alt="AI Core" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className={`max-w-[90%] md:max-w-[75%] space-y-2`}>
                                <div className={`px-5 py-4 text-[15px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-3xl rounded-br-sm' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-3xl rounded-bl-sm'}`}>
                                    <div className={`prose prose-sm md:prose-base max-w-none ${msg.role === 'user' ? 'text-white prose-headings:text-white prose-strong:text-white' : 'text-gray-800 dark:text-gray-100'}`}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                            code: ({ node, className, children, ...props }: any) => {
                                                const match = /language-(\w+)/.exec(className || '');
                                                return match ? (
                                                    <div className="rounded-xl overflow-hidden my-4 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                                        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-xs font-mono text-gray-500 border-b border-gray-200 dark:border-gray-700">{match[1]}</div>
                                                        <div className="p-4 overflow-x-auto text-sm"><code {...props} className={className}>{children}</code></div>
                                                    </div>
                                                ) : <code className="bg-black/10 px-1.5 py-0.5 rounded-md font-mono text-[0.9em]" {...props}>{children}</code>
                                            }
                                        }}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>

                                {/* Render Inline Web Search Images */}
                                {msg.images && msg.images.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                                        {msg.images.slice(0, 3).map((img, idx) => (
                                            <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer" className="block group rounded-xl overflow-hidden border border-gray-200 shadow-sm relative aspect-video bg-gray-100">
                                                <SafeImage src={img.thumbnail || img.image} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" width={300} />
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-[10px] font-medium truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {img.title}
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {msg.role === 'assistant' && (
                                    <div className="flex ml-2">
                                        {ttsSupported && (
                                            <button onClick={() => speakMessage(msg.content)} className="text-xs text-gray-400 hover:text-indigo-500 p-2 rounded-full transition-colors flex items-center gap-1.5 font-medium">
                                                {isSpeaking ? <><FaVolumeMute /> Stop Reading</> : <><FaVolumeUp /> Read Aloud</>}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}

                    {currentStatus && !streamingText && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 px-6 py-2">
                            <div className="w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></div>
                            <span className="text-sm font-medium text-gray-500 animate-pulse">
                                {currentStatus.replace('_', ' ')}...
                            </span>
                        </motion.div>
                    )}

                    {streamingText && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start items-start gap-4">
                            <div className="w-10 h-10 rounded-full border border-indigo-200 shadow-sm overflow-hidden shrink-0 mt-1 hidden sm:block">
                                <img src="/ai-avatar/teacher-thinking.png" alt="Thinking" className="w-full h-full object-cover" />
                            </div>
                            <div className="bg-white px-5 py-4 rounded-3xl rounded-bl-sm text-[15px] text-gray-800 border border-gray-100 shadow-sm">
                                <span className="whitespace-pre-wrap leading-relaxed">{streamingText}</span>
                                <span className="animate-pulse inline-block w-2 h-4 bg-indigo-500 ml-1 align-middle"></span>
                            </div>
                        </motion.div>
                    )}

                    {loading && !streamingText && !currentStatus && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-full border border-indigo-200 shadow-sm overflow-hidden shrink-0 mt-1 hidden sm:block">
                                <img src="/ai-avatar/teacher-thinking.png" alt="Thinking" className="w-full h-full object-cover" />
                            </div>
                            <div className="bg-white px-6 py-4 rounded-3xl rounded-bl-sm border border-gray-100 shadow-sm flex items-center gap-2">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Input Footer */}
            <footer className="flex-none bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="max-w-4xl mx-auto flex items-end gap-3 bg-gray-50 dark:bg-gray-900 rounded-3xl p-2 md:p-3 border border-gray-200 dark:border-gray-700 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100 transition-all shadow-sm">
                    <label className="flex-none p-3 md:p-3 text-gray-400 hover:text-indigo-500 hover:bg-white rounded-full cursor-pointer transition-colors shadow-sm bg-white border border-gray-100">
                        <FaCamera className="text-base" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={isListening ? "Listening..." : "Ask your AI Tutor anything..."}
                        className="flex-1 bg-transparent border-none outline-none py-3 text-[15px] resize-none max-h-[200px] text-gray-800 dark:text-gray-100 placeholder-gray-400"
                        rows={1}
                    />
                    <div className="flex items-center gap-1.5 mb-1 md:mb-1.5 mr-1 md:mr-1.5">
                        {hasSpeechRecognition && (
                            <button onClick={toggleVoice} className={`p-3 md:p-3 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-200' : 'bg-white text-gray-400 hover:text-indigo-500 border border-gray-100 hover:shadow-sm'}`}>
                                {isListening ? <FaMicrophoneSlash className="text-xs md:text-sm" /> : <FaMicrophone className="text-xs md:text-sm" />}
                            </button>
                        )}
                        <button onClick={sendMessage} disabled={loading || !input.trim()} className={`p-3 md:p-3 rounded-full transition-all shadow-md ${input.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 shadow-indigo-200' : 'bg-indigo-300 text-white/70 cursor-not-allowed'}`}>
                            {loading ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> : <FaPaperPlane className="text-xs md:text-sm relative translate-x-[1px]" />}
                        </button>
                    </div>
                </div>
                <div className="text-center mt-3 mb-1">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">AI Tutor can make mistakes. Consider verifying critical academic information.</p>
                </div>
            </footer>
        </div>
    );
}
