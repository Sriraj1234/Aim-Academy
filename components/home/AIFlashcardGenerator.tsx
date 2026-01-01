'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    const [loading, setLoading] = useState(false);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [savedSets, setSavedSets] = useState<FlashcardSet[]>([]);
    const [showGenerator, setShowGenerator] = useState(true);

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
                body: JSON.stringify({ topic, count: 8 })
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
            <div className="bg-white rounded-2xl p-4 md:p-5 border border-pw-border shadow-pw-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-pw-violet flex items-center gap-2">
                        <FaLightbulb className="text-yellow-500" /> {topic}
                    </h3>
                    <button onClick={resetToGenerator} className="text-sm text-gray-500 hover:text-pw-indigo flex items-center gap-1">
                        <FaRedo /> New Topic
                    </button>
                </div>

                {/* Card Counter */}
                <div className="text-center text-sm text-gray-400 mb-3">
                    Card {currentIndex + 1} of {flashcards.length}
                </div>

                {/* Flashcard */}
                <div
                    className="relative h-48 cursor-pointer perspective-1000"
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    <motion.div
                        className="absolute inset-0 rounded-xl shadow-lg backface-hidden"
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.4 }}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* Front (Term) */}
                        <div
                            className={`absolute inset-0 bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#d946ef] rounded-xl p-6 flex flex-col items-center justify-center text-white backface-hidden ${isFlipped ? 'invisible' : ''} shadow-inner border border-white/20`}
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent opacity-50" />
                            <span className="text-xs font-bold uppercase tracking-widest text-white/60 mb-3">Topic: {topic}</span>
                            <h4 className="text-3xl font-black text-center drop-shadow-md leading-tight">{card.term}</h4>
                            <div className="absolute bottom-6 flex flex-col items-center animate-bounce opacity-70">
                                <span className="text-[10px] uppercase font-bold tracking-widest">Tap to Flip</span>
                            </div>
                        </div>

                        {/* Back (Definition) */}
                        <div
                            className={`absolute inset-0 bg-gradient-to-br from-[#10b981] to-[#0d9488] rounded-xl p-8 flex flex-col items-center justify-center text-white backface-hidden ${!isFlipped ? 'invisible' : ''} shadow-inner border border-white/20`}
                            style={{ transform: 'rotateY(180deg)' }}
                        >
                            <span className="text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Definition</span>
                            <p className="text-lg md:text-xl font-medium text-center leading-relaxed drop-shadow-sm">{card.definition}</p>
                        </div>
                    </motion.div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-center gap-4 mt-4">
                    <button
                        onClick={prevCard}
                        className="p-4 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all active:scale-90 shadow-sm"
                    >
                        <FaArrowLeft />
                    </button>
                    <button
                        onClick={nextCard}
                        className="p-4 rounded-full bg-pw-indigo hover:bg-pw-violet text-white transition-all active:scale-90 shadow-md shadow-pw-indigo/30"
                    >
                        <FaArrowRight />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-4 md:p-5 border border-pw-border shadow-pw-md">
            <h3 className="text-lg font-bold text-pw-violet mb-4 flex items-center gap-2">
                <FaLightbulb className="text-yellow-500" /> AI Flashcard Generator
            </h3>

            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter topic (e.g., Photosynthesis)"
                    className="flex-1 px-4 py-2.5 border border-pw-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pw-indigo/30"
                    onKeyDown={(e) => e.key === 'Enter' && generateFlashcards()}
                />
                <button
                    onClick={generateFlashcards}
                    disabled={loading || !topic.trim()}
                    className="px-5 py-2.5 bg-pw-indigo text-white rounded-xl font-bold text-sm hover:bg-pw-violet transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading ? <FaSpinner className="animate-spin" /> : 'Generate'}
                </button>
            </div>

            {/* Saved Sets */}
            {savedSets.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Topics</p>
                    <div className="flex flex-wrap gap-2">
                        {savedSets.map((set, idx) => (
                            <div key={idx} className="group flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-sm hover:bg-pw-lavender/20 transition-colors">
                                <button onClick={() => loadSet(set)} className="text-gray-700 font-medium">
                                    {set.topic}
                                </button>
                                <button
                                    onClick={() => deleteSet(idx)}
                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <FaTrash className="text-xs" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
