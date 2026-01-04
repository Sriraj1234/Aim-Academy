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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    images?: { title: string; image: string; thumbnail?: string }[];
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
    // Gallery Modal State
    const [galleryImages, setGalleryImages] = useState<{ title: string; image: string }[]>([]);
    const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null); // Changed to textarea
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    // Hooks
    const { speak, stop, isSpeaking, isSupported: ttsSupported } = useSpeech();
    const { play } = useSound();
    const { userProfile, updateProfile } = useAuth(); // Get user profile and update function

    // Determine effective context (including AI memory)
    const effectiveContext = {
        ...context,
        class: context?.class || userProfile?.class,
        board: userProfile?.board,
        stream: userProfile?.stream,
        name: userProfile?.displayName,
        // AI Memory for personalization
        weakSubjects: userProfile?.aiMemory?.weakSubjects || [],
        preferredLanguage: userProfile?.aiMemory?.preferences?.language || 'hinglish',
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
            setTimeout(() => textareaRef.current?.focus(), 100);
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

            const lowerInput = userMessage.content.toLowerCase();
            let searchContextParts: string[] = [];
            let imageResults: any[] = [];

            // --- Smart Intent Detection ---
            // 1. Image Intent: Explicit requests OR Educational topics that benefit from visuals
            const explicitImageKeywords = ['show', 'image', 'photo', 'pic', 'tasveer', 'diagram', 'drawing', 'sketch', 'map', 'chart'];
            const eduVisualKeywords = ['structure', 'anatomy', 'mechanism', 'cycle', 'process', 'parts of', 'schematic', 'layout'];

            const isImageIntent = explicitImageKeywords.some(k => lowerInput.includes(k)) ||
                eduVisualKeywords.some(k => lowerInput.includes(k));

            // 2. Web Intent: Factual, Time-sensitive, or specific queries
            // Comprehensive list of Hindi, Hinglish, and English triggers
            const webKeywords = [
                // English triggers
                'search', 'google', 'current', 'latest', 'news', 'syllabus', 'omr', 'pattern', 'exam date',
                'who is', 'what is the', 'when is', 'where is', 'how many', 'how much',
                'weather', 'minister', 'president', 'ceo', 'founder', 'capital', 'population',
                'price', 'cost', 'salary', 'result', 'admit card', 'date sheet',
                // Hindi/Hinglish triggers
                'kon hai', 'kaun hai', 'kya hai', 'kab hai', 'kahan hai', 'kitna hai', 'kitne',
                'vartman', 'abhi', 'aaj', 'kal', 'mantri', 'mukhyamantri', 'cm', 'pm',
                'home minister', 'education minister', 'finance minister',
                'rajdhani', 'jansankhya', 'daam', 'kimat', 'result kab', 'exam kab',
                'bihar', 'india', 'bharat', 'state', 'district', 'jila',
                'yojana', 'scheme', 'sarkari', 'government', 'vacancy', 'bharti',
                // Question patterns (will trigger for any "who/what/when" style questions)
                'batao', 'bataiye', 'bata do', 'tell me about'
            ];
            const isWebIntent = !isImageIntent && webKeywords.some(k => lowerInput.includes(k));
            const shouldFetchWeb = webKeywords.some(k => lowerInput.includes(k));

            // --- AI Memory: Detect Weak Subject Mentions ---
            const weakSubjectPatterns = [
                /weak in (\w+)/i,
                /problem in (\w+)/i,
                /struggle with (\w+)/i,
                /(\w+) samajh nahi aata/i,
                /(\w+) mushkil hai/i,
                /(\w+) difficult/i,
            ];
            for (const pattern of weakSubjectPatterns) {
                const match = lowerInput.match(pattern);
                if (match && match[1]) {
                    const subject = match[1].charAt(0).toUpperCase() + match[1].slice(1);
                    const currentWeak = userProfile?.aiMemory?.weakSubjects || [];
                    if (!currentWeak.includes(subject)) {
                        const updatedMemory = {
                            weakSubjects: [...currentWeak, subject].slice(-5), // Keep last 5
                            topicsStudied: userProfile?.aiMemory?.topicsStudied || [],
                            preferences: userProfile?.aiMemory?.preferences || { language: 'hinglish', answerLength: 'short' },
                            lastInteraction: Date.now(),
                        };
                        updateProfile({ aiMemory: updatedMemory });
                        console.log(`[AI Memory] Added "${subject}" to weak subjects.`);
                    }
                    break; // Only detect one per message
                }
            }

            // --- Parallel Fetching (Agentic Behavior) ---
            const promises = [];

            if (isImageIntent) {
                setStreamingText('🔍 Searching for visual aids...');
                // Clean query for better image search: Remove command words but KEEP "photo" as it can be part of "synthesis" (photosynthesis)
                // We use a phrase-based cleaner for common starts, and then a lighter keyword remover
                let query = userMessage.content
                    .replace(/^(show|give|fetch|display|find|search)\s+(me\s+)?(an?|the\s+)?(images?|pics?|pictures?|photos?|diagrams?|sketches?|maps?|charts?)\s+(of\s+)?/i, '')
                    .replace(/\b(diagrams?|drawings?|sketches?)\b/gi, '') // Remove these styles as we append better ones
                    .trim();

                // If the user just typed "photo synthesis", we don't want to strip "photo" globally.

                promises.push(
                    fetch('/api/search', {
                        method: 'POST',
                        body: JSON.stringify({
                            query: `${query} scientific diagram labeled`, // Enforce educational quality
                            type: 'image'
                        })
                    }).then(res => res.json()).then(data => {
                        if (data.results && data.results.length > 0) {
                            imageResults = data.results;
                            searchContextParts.push(`[SYSTEM: I have displayed ${data.results.length} related images/diagrams to the user. Reference them in your explanation if helpful.]`);

                            // Immediately show images in chat stream
                            const imgMsg: Message = {
                                id: Date.now().toString() + '_img',
                                role: 'assistant',
                                content: 'Found these visuals for you:',
                                timestamp: new Date(),
                                images: data.results
                            };
                            setMessages(prev => [...prev, imgMsg]);
                        }
                    }).catch(err => console.error("Image search failed", err))
                );
            }

            if (shouldFetchWeb || isWebIntent) {
                if (!isImageIntent) setStreamingText('🌐 Verifying information...'); // Only show if not already showing image search
                const query = userMessage.content.replace(/(search|for|google|web|internet|find|about)/gi, '').trim();
                promises.push(
                    fetch('/api/search', {
                        method: 'POST',
                        body: JSON.stringify({ query: query || userMessage.content, type: 'text' })
                    }).then(res => res.json()).then(data => {
                        if (data.results && data.results.length > 0) {
                            const snippets = data.results.map((r: any) => `- ${r.title}: ${r.description}`).join('\n');
                            searchContextParts.push(`[SYSTEM: Real-time search results for "${query}":\n${snippets}\nUse this verified info to answer accurately.]`);
                        } else {
                            searchContextParts.push(`[SYSTEM: The web search for "${query}" FAILED to return any results and returned an empty list. Do NOT guess the answer based on your internal knowledge cutoff. Explicitly tell the user you cannot verify the current information online right now.]`);
                        }
                    }).catch(err => console.error("Web search failed", err))
                );
            }

            // Wait for all "tools" to finish
            if (promises.length > 0) {
                await Promise.all(promises);
            }

            // Construct Final Context
            let finalContext = userMessage.content;
            if (searchContextParts.length > 0) {
                finalContext = `${searchContextParts.join('\n\n')}\n\nUser Question: ${userMessage.content}`;
            }

            // Clear loading text before starting AI stream
            if (promises.length > 0) setStreamingText('');

            const history = messages.slice(-6).map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                content: m.content
            }));


            // Use streaming
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: finalContext, // Send context included
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
    }, [input, loading, messages, effectiveContext, play]); // Updated deps

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
                    <motion.div
                        className="fixed bottom-6 md:bottom-10 right-4 z-50 flex items-center justify-center"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                    >
                        {/* Sparkles */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                            className="absolute inset-0 pointer-events-none"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2, delay: 0 }}
                                className="absolute -top-2 -right-2 text-yellow-400 text-xl"
                            >
                                ✨
                            </motion.div>
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                                className="absolute -bottom-1 -left-1 text-indigo-400 text-lg"
                            >
                                ✨
                            </motion.div>
                        </motion.div>

                        {/* 3D Floating Button */}
                        <motion.button
                            whileHover={{ scale: 1.1, rotateY: 10 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsOpen(true)}
                            className="relative"
                        >
                            {/* Outer Glow Ring */}
                            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-75 blur-md animate-pulse" />

                            {/* Main 3D Button */}
                            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 p-1 shadow-2xl shadow-purple-500/40">
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center overflow-hidden">
                                    {/* 3D Robot Face */}
                                    <span className="text-3xl" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>🤖</span>
                                </div>
                            </div>

                            {/* Online Indicator */}
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
                        </motion.button>
                    </motion.div>
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
                        className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm h-[75vh] max-h-[650px] bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-[2.5rem] border border-white/20 shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-white/50 dark:bg-gray-800/50 p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                {/* 3D Avatar with Thinking State */}
                                <motion.div
                                    animate={loading ? {
                                        rotateY: [0, 15, -15, 0],
                                        scale: [1, 1.05, 1]
                                    } : {}}
                                    transition={{ repeat: loading ? Infinity : 0, duration: 1.5 }}
                                    className="relative"
                                >
                                    {/* Outer Glow Ring */}
                                    <div className={`absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-75 blur-sm ${loading ? 'animate-pulse' : ''}`} />

                                    {/* Main 3D Avatar */}
                                    <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-purple-500/30">
                                        <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center overflow-hidden">
                                            {/* Face with 3D depth */}
                                            <div className="relative">
                                                {loading ? (
                                                    // Thinking Face
                                                    <motion.div
                                                        animate={{ rotate: [0, 10, -10, 0] }}
                                                        transition={{ repeat: Infinity, duration: 2 }}
                                                        className="text-2xl"
                                                    >
                                                        🤔
                                                    </motion.div>
                                                ) : (
                                                    // Normal Face - Robot emoji for 3D effect
                                                    <span className="text-2xl">🤖</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Online Indicator */}
                                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`} />
                                </motion.div>
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg leading-tight">
                                        AI Companion
                                    </h3>
                                    <span className={`text-[10px] uppercase tracking-wider font-bold flex items-center gap-1 ${loading ? 'text-yellow-500' : 'text-indigo-500'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-yellow-400 animate-ping' : 'bg-green-500 animate-pulse'}`} />
                                        {loading ? 'Thinking...' : 'Always Online'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-500"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                            {messages.length === 0 && (
                                <div className="text-center py-10 px-6 flex flex-col items-center">
                                    <motion.div
                                        animate={{ y: [0, -10, 0], rotateY: [0, 5, -5, 0] }}
                                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                        className="relative w-36 h-36 mb-6"
                                    >
                                        {/* 3D Glow Background */}
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-30 blur-xl animate-pulse" />

                                        {/* Main Avatar Container */}
                                        <div className="relative w-full h-full rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-white/20 shadow-2xl flex items-center justify-center overflow-hidden">
                                            {/* Inner Gradient Ring */}
                                            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20" />

                                            {/* 3D Robot Face */}
                                            <span className="text-6xl drop-shadow-lg" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>🤖</span>
                                        </div>

                                        {/* Sparkle Effects */}
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="absolute -top-2 -right-2 text-yellow-400 text-xl"
                                        >
                                            ✨
                                        </motion.div>
                                    </motion.div>
                                    <h4 className="font-black text-2xl text-gray-800 dark:text-white mb-2">Hi there! 👋</h4>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed max-w-[80%] mx-auto">
                                        I'm your AI Study Buddy. Ask me anything about your syllabus, homework, or exams!
                                    </p>
                                    <div className="flex flex-wrap gap-2 justify-center w-full">
                                        {quickPrompts.map((q) => (
                                            <button
                                                key={q}
                                                onClick={() => setInput(q)}
                                                className="text-xs font-bold bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
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
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-end gap-2'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-6 h-6 rounded-full overflow-hidden bg-indigo-100 border border-gray-200 shrink-0 mb-1 flex items-center justify-center">
                                            <FaRobot className="w-4 h-4 text-indigo-600" />
                                        </div>
                                    )}

                                    <div className={`max-w-[85%] space-y-1`}>
                                        <div
                                            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                                ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-none'
                                                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none border'
                                                }`}
                                        >
                                            <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'text-white prose-headings:text-white prose-strong:text-white' : 'text-gray-800 dark:text-gray-100'}`}>
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                        ul: ({ node, ...props }) => <ul className="list-disc ml-4 space-y-1" {...props} />,
                                                        ol: ({ node, ...props }) => <ol className="list-decimal ml-4 space-y-1" {...props} />,
                                                        li: ({ node, ...props }) => <li className="" {...props} />,
                                                        code: ({ node, className, children, ...props }: any) => {
                                                            const match = /language-(\w+)/.exec(className || '')
                                                            return match ? (
                                                                <div className="rounded-lg overflow-hidden my-2 bg-black/20 p-2 text-xs backdrop-blur-sm">
                                                                    <code className={className} {...props}>
                                                                        {children}
                                                                    </code>
                                                                </div>
                                                            ) : (
                                                                <code className="bg-white/20 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                                                                    {children}
                                                                </code>
                                                            )
                                                        }
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>

                                        {/* Actions for Bot Message */}
                                        {msg.role === 'assistant' && (
                                            <div className="flex items-center gap-2 ml-1">
                                                {ttsSupported && (
                                                    <button
                                                        onClick={() => speakMessage(msg.content)}
                                                        className="text-[10px] font-bold text-gray-400 hover:text-indigo-500 flex items-center gap-1 transition-colors"
                                                    >
                                                        {isSpeaking ? <FaVolumeMute /> : <FaVolumeUp />}
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Image Carousel */}
                                        {msg.images && msg.images.length > 0 && (
                                            <div className="mt-2 flex gap-2 overflow-x-auto pb-2 px-1 snap-x scrollbar-hide">
                                                {msg.images.map((img, idx) => (
                                                    <div key={idx} className="flex-shrink-0 w-40 snap-center">
                                                        <div className="rounded-xl overflow-hidden shadow-md aspect-video bg-gray-100">
                                                            <img
                                                                src={img.image}
                                                                alt={img.title}
                                                                className="w-full h-full object-cover"
                                                                onClick={() => {
                                                                    setGalleryImages(msg.images || []);
                                                                    setGalleryIndex(idx);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Streaming indicator */}
                            {streamingText && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start items-end gap-2"
                                >
                                    {/* 3D Mini Avatar for Streaming */}
                                    <motion.div
                                        animate={{ rotateY: [0, 15, -15, 0], scale: [1, 1.05, 1] }}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                        className="relative shrink-0 mb-1"
                                    >
                                        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse blur-sm" />
                                        <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-yellow-400/50">
                                            <span className="text-sm">🤔</span>
                                        </div>
                                    </motion.div>
                                    <div className="bg-white px-5 py-3 rounded-2xl rounded-bl-none text-sm text-gray-800 shadow-sm border border-gray-100">
                                        {streamingText}
                                        <span className="animate-pulse inline-block w-2 h-4 bg-indigo-500 ml-1 align-middle"></span>
                                    </div>
                                </motion.div>
                            )}

                            {loading && !streamingText && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start items-end gap-2"
                                >
                                    {/* 3D Mini Avatar for Loading */}
                                    <motion.div
                                        animate={{ rotateY: [0, 20, -20, 0] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className="relative shrink-0 mb-1"
                                    >
                                        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse blur-sm" />
                                        <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-indigo-400/50">
                                            <motion.span
                                                animate={{ rotate: [0, 15, -15, 0] }}
                                                transition={{ repeat: Infinity, duration: 1 }}
                                                className="text-sm"
                                            >
                                                🤔
                                            </motion.span>
                                        </div>
                                    </motion.div>
                                    <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2 shadow-sm border border-gray-100">
                                        <span className="flex gap-1">
                                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </span>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md shrink-0">
                            <div className="flex items-end gap-2 bg-white dark:bg-gray-800 p-2 pl-4 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg ring-4 ring-gray-50 dark:ring-gray-800 transition-all focus-within:ring-indigo-50 dark:focus-within:ring-indigo-900/30">

                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => {
                                        setInput(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type your question..."
                                    rows={1}
                                    className="flex-1 bg-transparent border-none p-0 py-2 text-gray-800 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none resize-none max-h-[100px] overflow-y-auto"
                                />

                                <div className="flex items-center gap-1 pb-1">
                                    <button
                                        onClick={toggleVoice}
                                        disabled={!hasSpeechRecognition}
                                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isListening
                                            ? 'bg-red-50 text-red-500 animate-pulse'
                                            : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50'
                                            }`}
                                    >
                                        {isListening ? <FaMicrophoneSlash className="text-xs" /> : <FaMicrophone className="text-xs" />}
                                    </button>

                                    <button
                                        onClick={sendMessage}
                                        disabled={!input.trim() || loading}
                                        className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 disabled:opacity-50 hover:shadow-lg hover:scale-105 transition-all"
                                    >
                                        {loading ? <FaSpinner className="animate-spin text-xs" /> : <FaPaperPlane className="text-xs ml-0.5" />}
                                    </button>
                                </div>
                            </div>
                            <div className="text-[10px] text-center text-gray-400 mt-2 font-medium">
                                AI can make mistakes. Please verify important info.
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence >

            {/* Full Screen Image Gallery Modal */}
            <AnimatePresence>
                {
                    galleryIndex !== null && galleryImages.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
                            onClick={() => setGalleryIndex(null)}
                        >
                            {/* Close Button */}
                            <motion.button
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                onClick={() => setGalleryIndex(null)}
                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors backdrop-blur-md z-10"
                            >
                                <FaTimes />
                            </motion.button>

                            {/* Image Counter */}
                            <div className="absolute top-4 left-4 text-white/70 text-sm font-medium bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                                {galleryIndex + 1} / {galleryImages.length}
                            </div>

                            {/* Previous Button */}
                            {galleryIndex > 0 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setGalleryIndex(galleryIndex - 1); }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors backdrop-blur-md text-xl"
                                >
                                    ‹
                                </button>
                            )}

                            {/* Main Image */}
                            <motion.img
                                key={galleryIndex} // Force re-render on change
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                src={galleryImages[galleryIndex].image}
                                alt={galleryImages[galleryIndex].title}
                                className="max-w-[90vw] max-h-[80vh] rounded-2xl shadow-2xl object-contain"
                                onClick={(e) => e.stopPropagation()}
                            />

                            {/* Next Button */}
                            {galleryIndex < galleryImages.length - 1 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setGalleryIndex(galleryIndex + 1); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors backdrop-blur-md text-xl"
                                >
                                    ›
                                </button>
                            )}

                            {/* Image Title */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm max-w-[80%] truncate">
                                {galleryImages[galleryIndex].title}
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </>
    );
};
