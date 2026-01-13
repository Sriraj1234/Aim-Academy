'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { FaLightbulb, FaSpinner, FaArrowLeft, FaArrowRight, FaRedo, FaTrash, FaTimes, FaBolt, FaLayerGroup } from 'react-icons/fa';
import { UpgradeModal } from '../subscription/UpgradeModal';

interface Flashcard {
    term: string;
    definition: string;
    example?: string;
}

interface FlashcardSet {
    topic: string;
    cards: Flashcard[];
    createdAt: number;
}

const STORAGE_KEY = 'aim_flashcards';

export const AIFlashcardGenerator = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { userProfile, checkAccess } = useAuth();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [savedSets, setSavedSets] = useState<FlashcardSet[]>([]);
    const [showGenerator, setShowGenerator] = useState(true);

    // Load saved sets
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setSavedSets(JSON.parse(saved));
    }, []);

    const generateFlashcards = async () => {
        if (!topic.trim()) return;

        const hasAccess = checkAccess('flashcards');
        if (!hasAccess) {
            setShowUpgradeModal(true);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/ai/flashcards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic,
                    count: 10,
                    classLevel: userProfile?.class || '10',
                    board: userProfile?.board || 'CBSE'
                })
            });

            const data = await res.json();
            if (data.success && data.flashcards) {
                setFlashcards(data.flashcards);
                setCurrentIndex(0);
                setIsFlipped(false);
                setShowGenerator(false);

                const newSet: FlashcardSet = {
                    topic,
                    cards: data.flashcards,
                    createdAt: Date.now()
                };
                const updatedSets = [newSet, ...savedSets].slice(0, 10);
                setSavedSets(updatedSets);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSets));
            }
        } catch (e) {
            console.error(e);
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

    const handleNext = () => {
        if (currentIndex < flashcards.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev - 1), 200);
        }
    };

    return (
        <>
            {/* Trigger Card */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(true)}
                className="w-full h-full relative overflow-hidden bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 p-[1px] rounded-2xl shadow-xl shadow-cyan-500/20"
            >
                <div className="bg-[#0f0a1f]/90 backdrop-blur-xl h-full p-6 rounded-2xl flex flex-col justify-between group">
                    <div className="flex justify-between items-start">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <FaLayerGroup className="text-white text-xl" />
                        </div>
                        <FaBolt className="text-cyan-400/50" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">AI Flashcards</h4>
                        <p className="text-xs text-white/50 mt-1">Memorize concepts instantly</p>
                    </div>
                </div>
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#0f0a1f] w-full max-w-4xl h-[600px] rounded-3xl border border-white/10 shadow-2xl flex overflow-hidden relative"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Decorative Blobs */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

                            {/* Sidebar - History */}
                            <div className="w-64 border-r border-white/10 bg-white/5 p-4 hidden md:flex flex-col z-10">
                                <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Saved Decks</h3>
                                <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                                    <button
                                        onClick={() => setShowGenerator(true)}
                                        className={`w-full text-left p-3 rounded-xl text-sm font-medium transition-colors ${showGenerator ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-white/60 hover:bg-white/5'}`}
                                    >
                                        + New Deck
                                    </button>
                                    {savedSets.map((set, i) => (
                                        <div key={i} className="group relative">
                                            <button
                                                onClick={() => loadSet(set)}
                                                className="w-full text-left p-3 rounded-xl text-sm text-white/80 hover:bg-white/5 transition-colors truncate"
                                            >
                                                {set.topic}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const newSets = savedSets.filter((_, idx) => idx !== i);
                                                    setSavedSets(newSets);
                                                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSets));
                                                }}
                                                className="absolute right-2 top-3 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 p-8 flex flex-col items-center justify-center relative z-10">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="absolute top-6 right-6 text-white/40 hover:text-white"
                                >
                                    <FaTimes size={24} />
                                </button>

                                {showGenerator ? (
                                    <div className="w-full max-w-md text-center space-y-6">
                                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                            <FaLayerGroup className="text-4xl text-white" />
                                        </div>
                                        <h2 className="text-3xl font-bold text-white">Create Flashcards</h2>
                                        <p className="text-white/50">Enter any topic and AI will generate a study deck for you instantly.</p>

                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={topic}
                                                onChange={(e) => setTopic(e.target.value)}
                                                placeholder="e.g. Periodic Table, French Revolution..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-lg focus:outline-none focus:border-cyan-500/50 transition-colors placeholder-white/20"
                                                onKeyDown={(e) => e.key === 'Enter' && generateFlashcards()}
                                            />
                                            <button
                                                onClick={generateFlashcards}
                                                disabled={loading || !topic.trim()}
                                                className="absolute right-2 top-2 bottom-2 px-6 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold text-white transition-colors disabled:opacity-50 disabled:grayscale"
                                            >
                                                {loading ? <FaSpinner className="animate-spin" /> : 'Generate'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full max-w-lg perspective-1000">
                                        {/* Progress Bar */}
                                        <div className="w-full h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
                                            />
                                        </div>

                                        {/* 3D Card */}
                                        <div
                                            className="relative w-full aspect-[4/3] cursor-pointer group"
                                            onClick={() => setIsFlipped(!isFlipped)}
                                        >
                                            <motion.div
                                                className="w-full h-full relative preserve-3d transition-all duration-500"
                                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                            >
                                                {/* Front */}
                                                <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur-sm">
                                                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4">Topic</span>
                                                    <h3 className="text-3xl font-bold text-white">{flashcards[currentIndex]?.term}</h3>
                                                    <p className="mt-8 text-white/40 text-sm flex items-center gap-2">
                                                        <FaRedo className="text-xs" /> Tap to flip
                                                    </p>
                                                </div>

                                                {/* Back */}
                                                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur-sm">
                                                    <span className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Definition</span>
                                                    <p className="text-xl text-white/90 leading-relaxed font-medium">
                                                        {flashcards[currentIndex]?.definition}
                                                    </p>
                                                    {flashcards[currentIndex]?.example && (
                                                        <div className="mt-6 bg-black/20 px-4 py-2 rounded-lg border border-white/5">
                                                            <p className="text-sm text-cyan-200 italic">
                                                                "{flashcards[currentIndex].example}"
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        </div>

                                        {/* Controls */}
                                        <div className="flex justify-between items-center mt-8">
                                            <button
                                                onClick={handlePrev}
                                                disabled={currentIndex === 0}
                                                className="p-4 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
                                            >
                                                <FaArrowLeft className="text-white" />
                                            </button>
                                            <span className="text-white/40 font-mono text-sm">
                                                {currentIndex + 1} / {flashcards.length}
                                            </span>
                                            <button
                                                onClick={handleNext}
                                                disabled={currentIndex === flashcards.length - 1}
                                                className="p-4 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
                                            >
                                                <FaArrowRight className="text-white" />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => setShowGenerator(true)}
                                            className="w-full mt-6 py-3 text-sm font-bold text-white/30 hover:text-white transition-colors"
                                        >
                                            Start Over
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
        </>
    );
};
