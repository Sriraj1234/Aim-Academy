'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { FaLightbulb, FaSpinner, FaArrowLeft, FaArrowRight, FaRedo, FaTrash } from 'react-icons/fa';

interface Flashcard {
    term: string;
    definition: string;
}

interface FlashcardSet {
    topic: string;
    cards: Flashcard[];
    createdAt: number;
}

const STORAGE_KEY = 'aim_flashcards';

export const AIFlashcardGenerator = () => {
    const [topic, setTopic] = useState('');
    const [language, setLanguage] = useState<'english' | 'hindi' | 'hinglish'>('english');
    const [loading, setLoading] = useState(false);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [savedSets, setSavedSets] = useState<FlashcardSet[]>([]);
    const [showGenerator, setShowGenerator] = useState(true);

    const { userProfile } = useAuth(); // Get user context

    // Load saved flashcards from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            setSavedSets(JSON.parse(saved));
        }
    }, []);

    const generateFlashcards = async () => {
        if (!topic.trim()) return;

        setLoading(true);
        try {
            const res = await fetch('/api/ai/flashcards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic,
                    count: 10,
                    classLevel: userProfile?.class || '10',
                    board: userProfile?.board || 'CBSE',
                    language // Pass selected language
                })
            });

            const data = await res.json();

            if (data.success && data.flashcards) {
                setFlashcards(data.flashcards);
                setCurrentIndex(0);
                setIsFlipped(false);
                setShowGenerator(false);

                // Save to localStorage
                const newSet: FlashcardSet = {
                    topic: topic,
                    cards: data.flashcards,
                    createdAt: Date.now()
                };
                const updated = [newSet, ...savedSets.slice(0, 4)]; // Keep last 5
                setSavedSets(updated);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            }
        } catch (error) {
            console.error('Failed to generate flashcards:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSet = (set: FlashcardSet) => {
        setFlashcards(set.cards);
        setTopic(set.topic);
        setCurrentIndex(0);
        setIsFlipped(false);
        setShowGenerator(false);
    };

    const deleteSet = (index: number) => {
        const updated = savedSets.filter((_, i) => i !== index);
        setSavedSets(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    const nextCard = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex((prev) => (prev + 1) % flashcards.length), 150);
    };

    const prevCard = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length), 150);
    };

    const resetToGenerator = () => {
        setShowGenerator(true);
        setFlashcards([]);
        setTopic('');
    };

    if (!showGenerator && flashcards.length > 0) {
        const card = flashcards[currentIndex];
        return (
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white/50 shadow-pw-xl relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-pw-violet/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="text-xl font-display font-bold text-pw-violet flex items-center gap-2">
                        <span className="p-2 bg-yellow-100 rounded-xl text-yellow-600 shadow-sm"><FaLightbulb /></span>
                        {topic}
                    </h3>
                    <button onClick={resetToGenerator} className="text-sm font-bold text-gray-500 hover:text-pw-indigo flex items-center gap-2 bg-gray-100/50 hover:bg-white px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-gray-200 shadow-sm">
                        <FaRedo className="text-xs" /> New
                    </button>
                </div>

                {/* Card Counter */}
                <div className="flex justify-center mb-4">
                    <span className="bg-gray-100/80 px-3 py-1 rounded-full text-xs font-bold text-gray-500 font-mono tracking-wider border border-white/50">
                        {currentIndex + 1} / {flashcards.length}
                    </span>
                </div>

                {/* Flashcard */}
                <div
                    className="relative h-64 md:h-72 cursor-pointer perspective-1000 group"
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    <motion.div
                        className="absolute inset-0 rounded-[2rem] shadow-xl backface-hidden transition-all duration-500"
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        initial={false}
                        transition={{ duration: 0.5, type: "spring", stiffness: 260, damping: 20 }}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* Front (Term) */}
                        <div
                            className={`absolute inset-0 bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#d946ef] rounded-[2rem] p-8 flex flex-col items-center justify-center text-white backface-hidden ${isFlipped ? 'invisible' : ''} shadow-inner ring-1 ring-white/20`}
                        >
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                            <div className="absolute top-6 left-6 text-white/40 font-bold text-xs tracking-[0.2em] uppercase">Flashcard</div>

                            <h4 className="text-2xl md:text-3xl font-black text-center drop-shadow-lg leading-tight relative z-10 font-display">
                                {card.term}
                            </h4>

                            <div className="absolute bottom-6 flex flex-col items-center opacity-80 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] bg-white/20 px-3 py-1 rounded-full backdrop-blur-md uppercase font-bold tracking-widest border border-white/10 shadow-sm">
                                    Tap to Flip
                                </span>
                            </div>
                        </div>

                        {/* Back (Definition) */}
                        <div
                            className={`absolute inset-0 bg-white rounded-[2rem] p-6 flex flex-col items-center justify-center text-gray-800 backface-hidden ${!isFlipped ? 'invisible' : ''} shadow-inner border-2 border-pw-border`}
                            style={{ transform: 'rotateY(180deg)' }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 rounded-[2rem]" />
                            <span className="relative z-10 text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full mb-3">
                                Definition
                            </span>
                            <p className="relative z-10 text-base font-medium text-center leading-relaxed text-gray-700 overflow-y-auto max-h-[70%] scrollbar-hide">
                                {card.definition}
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-center gap-6 mt-6">
                    <button
                        onClick={prevCard}
                        className="w-12 h-12 rounded-full bg-white border border-gray-100 hover:border-pw-indigo/20 text-gray-400 hover:text-pw-indigo transition-all active:scale-90 shadow-md hover:shadow-lg flex items-center justify-center group"
                    >
                        <FaArrowLeft className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <button
                        onClick={nextCard}
                        className="w-14 h-14 rounded-full bg-gradient-to-r from-pw-indigo to-pw-violet text-white transition-all active:scale-90 shadow-lg hover:shadow-pw-indigo/40 hover:-translate-y-1 flex items-center justify-center group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <FaArrowRight className="text-xl group-hover:translate-x-0.5 transition-transform relative z-10" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] p-6 border border-pw-border shadow-pw-lg relative overflow-hidden group hover:shadow-pw-xl transition-all duration-300">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-pw-lavender/30 to-transparent rounded-bl-full -mr-16 -mt-16 transition-opacity opacity-50 group-hover:opacity-100" />

            <h3 className="text-xl font-display font-bold text-pw-violet mb-6 flex items-center gap-3 relative z-10">
                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-200">
                    <FaLightbulb />
                </span>
                AI Flashcard Generator
            </h3>

            <div className="flex flex-col gap-3 mb-6 relative z-10">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter topic (e.g., Quantum Physics)..."
                    className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl text-gray-700 bg-gray-50/50 focus:bg-white focus:border-pw-indigo focus:ring-4 focus:ring-pw-indigo/10 transition-all outline-none font-medium placeholder-gray-400"
                    onKeyDown={(e) => e.key === 'Enter' && generateFlashcards()}
                />

                {/* Language Selector */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Language:</span>
                    <div className="flex gap-1.5 flex-1">
                        {(['english', 'hindi', 'hinglish'] as const).map((lang) => (
                            <button
                                key={lang}
                                onClick={() => setLanguage(lang)}
                                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${language === lang
                                        ? 'bg-pw-indigo text-white shadow-md'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                {lang === 'english' ? '🇬🇧 English' : lang === 'hindi' ? '🇮🇳 हिंदी' : '🌐 Hinglish'}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={generateFlashcards}
                    disabled={loading || !topic.trim()}
                    className="w-full px-8 py-4 bg-pw-violet hover:bg-pw-indigo text-white rounded-2xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-pw-violet/20"
                >
                    {loading ? <FaSpinner className="animate-spin text-lg" /> : <>Generate Flashcards <FaArrowRight className="text-sm" /></>}
                </button>
            </div>

            {/* Saved Sets */}
            {savedSets.length > 0 && (
                <div className="relative z-10">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Recent Searches</p>
                    <div className="flex flex-wrap gap-2">
                        {savedSets.map((set, idx) => (
                            <div key={idx} className="group flex items-center gap-2 pl-4 pr-2 py-2 bg-white border border-gray-100 rounded-xl text-sm hover:border-pw-indigo/30 hover:shadow-md transition-all cursor-pointer">
                                <button onClick={() => loadSet(set)} className="text-gray-600 font-bold group-hover:text-pw-indigo transition-colors">
                                    {set.topic}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteSet(idx); }}
                                    className="w-6 h-6 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 flex items-center justify-center transition-colors"
                                >
                                    <FaTrash className="text-[10px]" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
