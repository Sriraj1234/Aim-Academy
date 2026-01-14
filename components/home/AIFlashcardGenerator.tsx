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

interface FlashcardSet {
    id: string;
    topic: string;
    subject: string;
    date: number;
    cards: Flashcard[];
}

const SUBJECTS = [
    'Physics', 'Chemistry', 'Biology',
    'History', 'Geography', 'Economics', 'Political Science'
];

export const AIFlashcardGenerator = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { userProfile, checkAccess } = useAuth();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // History & Zoom State
    const [history, setHistory] = useState<FlashcardSet[]>([]);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    // Load history on mount
    useState(() => {
        const saved = localStorage.getItem('ai_flashcards_history');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load history", e);
            }
        }
    });

    const saveToHistory = (newSet: FlashcardSet) => {
        const updated = [newSet, ...history].slice(0, 5); // Keep last 5
        setHistory(updated);
        localStorage.setItem('ai_flashcards_history', JSON.stringify(updated));
    };

    const loadFromHistory = (set: FlashcardSet) => {
        setSubject(set.subject);
        setTopic(set.topic);
        setFlashcards(set.cards);
        setCurrentIndex(0);
        setIsFlipped(false);
        setShowResult(true);
    };

    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [language, setLanguage] = useState<'english' | 'hindi' | 'hinglish'>('hinglish');

    const [loading, setLoading] = useState(false);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showResult, setShowResult] = useState(false);

    const generateFlashcards = async () => {
        if (!topic.trim() || !subject) return;

        const hasAccess = checkAccess('flashcards');
        if (!hasAccess) {
            setShowUpgradeModal(true);
            return;
        }

        setLoading(true);
        try {
            // Combine subject and topic for better context
            const fullTopic = `${subject}: ${topic}`;

            const res = await fetch('/api/ai/flashcards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: fullTopic,
                    count: 10,
                    classLevel: userProfile?.class || '10',
                    board: userProfile?.board || 'CBSE',
                    language
                })
            });

            const data = await res.json();
            if (data.success && data.flashcards) {
                const newSet: FlashcardSet = {
                    id: Date.now().toString(),
                    topic: fullTopic, // saving full topic "Subject: Topic"
                    subject,
                    date: Date.now(),
                    cards: data.flashcards
                };

                setFlashcards(data.flashcards);
                saveToHistory(newSet);

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
                                    <div className="space-y-6">
                                        <div className="text-center pb-4">
                                            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <FaLayerGroup className="text-2xl text-indigo-500" />
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Study Set</h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Select subject and topic to generate flashcards.</p>
                                        </div>

                                        {/* Subject Selection */}
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject</label>
                                            <div className="flex flex-wrap gap-2">
                                                {SUBJECTS.map((s) => (
                                                    <button
                                                        key={s}
                                                        onClick={() => setSubject(s)}
                                                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${subject === s
                                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                                                            : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                                                            }`}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Topic Input */}
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Chapter / Topic Name</label>
                                            <input
                                                type="text"
                                                value={topic}
                                                onChange={(e) => setTopic(e.target.value)}
                                                placeholder="e.g. Light Reflection and Refraction"
                                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-white font-medium"
                                                onKeyDown={(e) => e.key === 'Enter' && generateFlashcards()}
                                            />
                                        </div>

                                        {/* Language Selection */}
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Language</label>
                                            <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                                                {['english', 'hinglish', 'hindi'].map((lang) => (
                                                    <button
                                                        key={lang}
                                                        onClick={() => setLanguage(lang as any)}
                                                        className={`flex-1 py-2 capitalize text-xs font-bold rounded-lg transition-all ${language === lang ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                                    >
                                                        {lang}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={generateFlashcards}
                                            disabled={loading || !topic.trim() || !subject}
                                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:grayscale shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
                                        >
                                            {loading ? (
                                                <>
                                                    <FaSpinner className="animate-spin" />
                                                    <span>Generating...</span>
                                                </>
                                            ) : (
                                                'Generate Flashcards'
                                            )}
                                        </button>

                                        {/* Recent History */}
                                        {history.length > 0 && (
                                            <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Recent Generations</h4>
                                                <div className="space-y-2">
                                                    {history.map((set) => (
                                                        <button
                                                            key={set.id}
                                                            onClick={() => loadFromHistory(set)}
                                                            className="w-full p-3 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-all text-left group"
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <span className="font-bold text-gray-700 dark:text-gray-200 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                                                    {set.topic.split(': ')[1] || set.topic}
                                                                </span>
                                                                <span className="text-xs text-gray-400">{new Date(set.date).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="text-xs text-gray-400 mt-1">{set.cards.length} cards • {set.subject}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
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
                                                <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
                                                    <div className="h-full w-full overflow-y-auto custom-scrollbar">
                                                        <div className="min-h-full flex flex-col items-center justify-center p-6 text-center">
                                                            <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2 shrink-0">Term</span>

                                                            {flashcards[currentIndex]?.imageUrl ? (
                                                                <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                                                                    <img
                                                                        src={flashcards[currentIndex].imageUrl}
                                                                        alt={flashcards[currentIndex].term}
                                                                        className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal cursor-zoom-in hover:scale-105 transition-transform"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setZoomedImage(flashcards[currentIndex].imageUrl || null);
                                                                        }}
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                                        }}
                                                                    />
                                                                </div>
                                                            ) : null}

                                                            <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{flashcards[currentIndex]?.term}</h3>
                                                            <p className="mt-4 text-gray-400 text-xs flex items-center gap-2 shrink-0">
                                                                <FaRedo /> Tap to flip
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Back */}
                                                <div
                                                    className="absolute inset-0 backface-hidden bg-indigo-50 dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-2xl shadow-xl overflow-hidden"
                                                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                                                >
                                                    <div className="h-full w-full overflow-y-auto custom-scrollbar">
                                                        <div className="min-h-full flex flex-col items-center justify-center p-8 text-center">
                                                            <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-4 shrink-0">Definition</span>
                                                            <p className="text-lg text-gray-700 dark:text-gray-200 leading-relaxed font-medium">
                                                                {flashcards[currentIndex]?.definition}
                                                            </p>
                                                            {flashcards[currentIndex]?.example && (
                                                                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 italic">
                                                                    "{flashcards[currentIndex].example}"
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
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
                    </div >
                )}
            </AnimatePresence >

            {/* Image Zoom Modal */}
            <AnimatePresence>
                {
                    zoomedImage && (
                        <div
                            className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
                            onClick={() => setZoomedImage(null)}
                        >
                            <motion.img
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                src={zoomedImage}
                                alt="Zoomed"
                                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                            />
                            <button
                                onClick={() => setZoomedImage(null)}
                                className="absolute top-4 right-4 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    )
                }
            </AnimatePresence >

            <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} featureName="AI Flashcards" />
        </>
    );
};
