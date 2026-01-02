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
            // We verify "syllabus", "dates", "news", "current", "who is", "latest"
            // Including Hinglish/Hindi keywords for broader support
            const webKeywords = [
                'search', 'google', 'current', 'latest', 'news', 'syllabus', 'omr', 'pattern', 'exam date',
                'who is', 'what is the price', 'weather', 'minister', 'president', 'ceo', 'founder',
                'karrent', 'current', 'vartman', 'kaun hai', 'kya hai', 'kab', 'kahan', 'mantri', 'yojana'
            ];
            const isWebIntent = !isImageIntent && webKeywords.some(k => lowerInput.includes(k));
            // Note: We prioritize images for "What is photosynthesis?" but if it's "What is the syllabus", we want web.
            // A hybrid approach: 
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
                // Clean query for better image search: Remove command words but keep structure/topic intact
                // We keep 'of' to preserve "structure of X"
                const query = userMessage.content.replace(/\b(show|me|images?|photos?|pics?|diagrams?|drawings?|sketches?|pictures?)\b/gi, '').trim();
                promises.push(
                    fetch('/api/search', {
                        method: 'POST',
                        body: JSON.stringify({ query: query || userMessage.content, type: 'image' })
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
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 md:bottom-24 right-4 z-50 w-12 h-12 md:w-14 md:h-14 rounded-full md:rounded-[2rem] bg-pw-violet text-white shadow-pw-lg border-2 border-white flex items-center justify-center transform transition-all duration-300"
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
                        className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm h-[70vh] max-h-[600px] bg-white dark:bg-gray-900 rounded-[2rem] border border-pw-border dark:border-gray-700 shadow-pw-xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-pw-surface dark:bg-gray-800 p-5 border-b border-pw-border dark:border-gray-700 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-[1rem] bg-pw-violet text-white flex items-center justify-center relative shadow-pw-md">
                                    <FaRobot className="text-xl" />
                                    <HiLightningBolt className="absolute -top-1 -right-1 text-yellow-400 text-base" />
                                </div>
                                <div>
                                    <h3 className="font-display font-bold text-pw-violet dark:text-purple-400 text-lg flex items-center gap-2">
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
                                className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-100 dark:border-gray-600 flex items-center justify-center transition-colors text-gray-400 dark:text-gray-300 hover:text-red-500"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/50 dark:bg-gray-900/50 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                            {messages.length === 0 && (
                                <div className="text-center py-12 px-6">
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-[2rem] bg-pw-surface border-2 border-white shadow-pw-sm flex items-center justify-center relative">
                                        <FaRobot className="text-4xl text-pw-indigo" />
                                        <HiSparkles className="absolute -top-2 -right-2 text-2xl text-yellow-400" />
                                    </div>
                                    <h4 className="font-bold text-pw-violet dark:text-purple-400 text-lg mb-2">Hello Bachhon! 👋</h4>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                                        Main hoon aapka AIM Buddy! <br />
                                        Padhai mein koi bhi help chahiye?
                                    </p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {quickPrompts.map((q) => (
                                            <button
                                                key={q}
                                                onClick={() => setInput(q)}
                                                className="text-xs font-bold bg-white dark:bg-gray-700 hover:bg-pw-surface dark:hover:bg-gray-600 hover:text-pw-indigo dark:hover:text-purple-300 text-gray-600 dark:text-gray-300 border border-pw-border dark:border-gray-600 px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
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
                                                : 'bg-white dark:bg-gray-800 border border-pw-border dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-md'
                                                }`}
                                        >
                                            <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                        ul: ({ node, ...props }) => <ul className="list-disc ml-4 space-y-1" {...props} />,
                                                        ol: ({ node, ...props }) => <ol className="list-decimal ml-4 space-y-1" {...props} />,
                                                        li: ({ node, ...props }) => <li className="" {...props} />,
                                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                        code: ({ node, className, children, ...props }: any) => {
                                                            const match = /language-(\w+)/.exec(className || '')
                                                            return match ? (
                                                                <div className="rounded-md overflow-hidden my-2 bg-gray-800 text-white p-2 text-xs">
                                                                    <code className={className} {...props}>
                                                                        {children}
                                                                    </code>
                                                                </div>
                                                            ) : (
                                                                <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono text-red-500" {...props}>
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

                                        {msg.role === 'assistant' && ttsSupported && (
                                            <button
                                                onClick={() => speakMessage(msg.content)}
                                                className="text-[10px] font-bold text-pw-indigo hover:text-pw-violet flex items-center gap-1 ml-2 px-2 py-1 bg-pw-surface rounded-full w-fit"
                                            >
                                                {isSpeaking ? <FaVolumeMute /> : <FaVolumeUp />}
                                                {isSpeaking ? 'Stop' : 'Listen'}
                                            </button>
                                        )}

                                        {/* Image Carousel */}
                                        {msg.images && msg.images.length > 0 && (
                                            <div className="mt-3 flex gap-2 overflow-x-auto pb-2 snap-x">
                                                {msg.images.map((img, idx) => (
                                                    <div key={idx} className="flex-shrink-0 w-48 snap-center">
                                                        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm aspect-video bg-gray-100 dark:bg-gray-800">
                                                            <img
                                                                src={img.image}
                                                                alt={img.title}
                                                                className="w-full h-full object-cover transition-transform hover:scale-105 cursor-pointer"
                                                                onClick={() => {
                                                                    setGalleryImages(msg.images || []);
                                                                    setGalleryIndex(idx);
                                                                }}
                                                                loading="lazy"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Image+Load+Error';
                                                                }}
                                                            />
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 truncate px-1">{img.title}</p>
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
                        <div className="p-4 border-t border-pw-border dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
                            <div className="flex items-end gap-3 bg-pw-surface dark:bg-gray-800 p-2 rounded-[1.5rem] border border-pw-border dark:border-gray-700 shadow-inner">
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

                                {/* Text Input - Textarea for expansion */}
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => {
                                        setInput(e.target.value);
                                        // Auto-resize
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            sendMessage();
                                        }
                                    }}
                                    placeholder={isListening ? "Listening..." : "Poocho jo poochna hai..."}
                                    rows={1}
                                    className="flex-1 bg-transparent border-none px-2 text-gray-800 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 font-medium resize-none max-h-[120px] overflow-y-auto"
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
            {/* Full Screen Image Gallery Modal */}
            <AnimatePresence>
                {galleryIndex !== null && galleryImages.length > 0 && (
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
                )}
            </AnimatePresence>
        </>
    );
};
