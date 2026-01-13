'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { FaLayerGroup, FaBolt, FaTimes, FaSpinner, FaArrowLeft, FaArrowRight, FaRedo } from 'react-icons/fa';
import { UpgradeModal } from '../subscription/UpgradeModal';

interface Flashcard {
    term: string;
    definition: string;
    example?: string;
    imageUrl?: string;
}

export const AIFlashcardGenerator = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { userProfile, checkAccess } = useAuth();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showResult, setShowResult] = useState(false);

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
                setShowResult(true);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < flashcards.length - 1) {
            setIsFlipped(false);
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setCurrentIndex(prev => prev - 1);
        }
    };

    const reset = () => {
        setShowResult(false);
        setTopic('');
        setFlashcards([]);
        setCurrentIndex(0);
    };

    return (
        <>
            {/* Trigger Card - Keeping consistent with Grid but simpler internal style */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(true)}
                className="w-full h-full relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] rounded-2xl shadow-xl"
            >
                <div className="bg-white/10 backdrop-blur-md h-full p-6 rounded-2xl flex flex-col justify-between group">
                    <div className="flex justify-between items-start">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shadow-lg">
                            <FaLayerGroup className="text-white text-xl" />
                        </div>
                        <FaBolt className="text-white/50" />
                    </div>
                    <div className="text-left mt-4">
                        <h4 className="text-lg font-bold text-white">AI Flashcards</h4>
                        <p className="text-xs text-white/70 mt-1">Memorize instantly</p>
                    </div>
                </div>
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <FaLayerGroup className="text-indigo-500" />
                                    AI Flashcard Generator
                                </h3>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                                    <FaTimes className="text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 md:p-8 overflow-y-auto">
                                {!showResult ? (
                                    <div className="space-y-6 text-center py-8">
                                        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FaLayerGroup className="text-3xl text-indigo-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create Study Set</h2>
                                            <p className="text-gray-500 dark:text-gray-400">Enter a topic and let AI create flashcards for you.</p>
                                        </div>

                                        <div className="relative max-w-md mx-auto">
                                            <input
                                                type="text"
                                                value={topic}
                                                onChange={(e) => setTopic(e.target.value)}
                                                placeholder="e.g. Newton's Laws, Cell Biology..."
                                                className="w-full px-5 py-3 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-transparent focus:border-indigo-500 outline-none transition-colors dark:text-white"
                                                onKeyDown={(e) => e.key === 'Enter' && generateFlashcards()}
                                            />
                                            <button
                                                onClick={generateFlashcards}
                                                disabled={loading || !topic.trim()}
                                                className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                                            >
                                                {loading ? <FaSpinner className="animate-spin" /> : 'Generate'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-w-xl mx-auto">
                                        {/* Progress */}
                                        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                                            <span>Card {currentIndex + 1} of {flashcards.length}</span>
                                            <span>{Math.round(((currentIndex + 1) / flashcards.length) * 100)}% Completed</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full mb-6 overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 transition-all duration-300"
                                                style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
                                            />
                                        </div>

                                        {/* Classic Flashcard - Click to Flip */}
                                        <div
                                            onClick={() => setIsFlipped(!isFlipped)}
                                            className="cursor-pointer perspective-1000 group h-80 w-full"
                                        >
                                            <motion.div
                                                initial={false}
                                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                                                className="relative w-full h-full preserve-3d"
                                                style={{ transformStyle: 'preserve-3d' }}
                                            >
                                                {/* Front */}
                                                <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-2xl shadow-xl flex flex-col items-center justify-center p-6 text-center overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
                                                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2 z-10">Term</span>

                                                    {flashcards[currentIndex]?.imageUrl ? (
                                                        <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                                                            <img
                                                                src={flashcards[currentIndex].imageUrl}
                                                                alt={flashcards[currentIndex].term}
                                                                className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                }}
                                                            />
                                                        </div>
                                                    ) : null}

                                                    <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white z-10">{flashcards[currentIndex]?.term}</h3>
                                                    <p className="mt-4 text-gray-400 text-xs flex items-center gap-2 z-10">
                                                        <FaRedo /> Tap to flip
                                                    </p>
                                                </div>

                                                {/* Back */}
                                                <div
                                                    className="absolute inset-0 backface-hidden bg-indigo-50 dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 text-center"
                                                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                                                >
                                                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-4">Definition</span>
                                                    <p className="text-lg text-gray-700 dark:text-gray-200 leading-relaxed font-medium">
                                                        {flashcards[currentIndex]?.definition}
                                                    </p>
                                                    {flashcards[currentIndex]?.example && (
                                                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 italic">
                                                            "{flashcards[currentIndex].example}"
                                                        </p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        </div>

                                        {/* Controls */}
                                        <div className="flex justify-between items-center mt-8">
                                            <button
                                                onClick={handlePrev}
                                                disabled={currentIndex === 0}
                                                className="p-4 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 disabled:opacity-50 transition-colors"
                                            >
                                                <FaArrowLeft />
                                            </button>

                                            <button
                                                onClick={reset}
                                                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                                            >
                                                New Set
                                            </button>

                                            <button
                                                onClick={handleNext}
                                                disabled={currentIndex === flashcards.length - 1}
                                                className="p-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                                            >
                                                <FaArrowRight />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} featureName="AI Flashcards" />
        </>
    );
};
