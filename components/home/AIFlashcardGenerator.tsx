'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { FaLightbulb, FaSpinner, FaArrowLeft, FaArrowRight, FaRedo, FaTrash, FaTimes } from 'react-icons/fa';

interface Flashcard {
    term: string;
    definition: string;
    example?: string;
    imageUrl?: string;
}

interface FlashcardSet {
    topic: string;
    cards: Flashcard[];
    createdAt: number;
}

const STORAGE_KEY = 'aim_flashcards';

export const AIFlashcardGenerator = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { userProfile } = useAuth();

    const [topic, setTopic] = useState('');
    const [language, setLanguage] = useState<'english' | 'hindi' | 'hinglish'>('english');
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
                body: JSON.stringify({
                    topic,
                    count: 10,
                    classLevel: userProfile?.class || '10',
                    board: userProfile?.board || 'CBSE',
                    language
                })
            });

            const data = await res.json();

            if (data.success && data.flashcards) {
                setFlashcards(data.flashcards);
                setCurrentIndex(0);
                setIsFlipped(false);
                setShowGenerator(false);

                const newSet: FlashcardSet = {
                    topic: topic,
                    cards: data.flashcards,
                    createdAt: Date.now()
                };
                const updated = [newSet, ...savedSets.slice(0, 4)];
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

    // --- RENDER HELPERS ---

    // 1. Flashcard Display (Inside Modal)
    const renderFlashcardView = () => (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="p-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg"><FaLightbulb /></span>
                    {topic}
                </h3>
                <button onClick={resetToGenerator} className="text-xs font-bold text-white/60 hover:text-white flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all">
                    <FaRedo className="text-[10px]" /> New
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
                <div className="relative w-full max-w-sm aspect-[4/3] perspective-1000 group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                    <motion.div
                        className="absolute inset-0 rounded-[2rem] shadow-2xl backface-hidden transition-all duration-500"
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        initial={false}
                        transition={{ duration: 0.5, type: "spring", stiffness: 260, damping: 20 }}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* Front */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#d946ef] rounded-[2rem] p-6 flex flex-col items-center justify-center text-white backface-hidden shadow-inner ring-1 ring-white/20 overflow-hidden ${isFlipped ? 'invisible' : ''}`}>
                            {/* Background Image */}
                            {flashcards[currentIndex].imageUrl && (
                                <div
                                    className="absolute inset-0 bg-cover bg-center opacity-30"
                                    style={{ backgroundImage: `url(${flashcards[currentIndex].imageUrl})` }}
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                            <div className="absolute top-4 left-4 text-white/60 font-bold text-[10px] tracking-[0.2em] uppercase z-10">Term</div>
                            <h4 className="text-2xl font-black text-center drop-shadow-lg leading-tight z-10">{flashcards[currentIndex].term}</h4>
                            <div className="absolute bottom-4 opacity-80 text-[10px] bg-black/30 px-3 py-1 rounded-full z-10 backdrop-blur-sm">Tap to Flip</div>
                        </div>

                        {/* Back */}
                        <div className={`absolute inset-0 bg-[#0f0a1f] rounded-[2rem] p-5 flex flex-col text-white backface-hidden border border-white/10 shadow-xl overflow-hidden ${!isFlipped ? 'invisible' : ''}`} style={{ transform: 'rotateY(180deg)' }}>
                            <div className="text-emerald-400 font-bold text-[10px] tracking-[0.2em] uppercase mb-2">Definition</div>
                            <p className="text-sm font-medium leading-relaxed text-white/90 flex-1 overflow-y-auto custom-scrollbar">{flashcards[currentIndex].definition}</p>

                            {flashcards[currentIndex].example && (
                                <div className="mt-3 pt-3 border-t border-white/10">
                                    <div className="text-yellow-400 font-bold text-[10px] tracking-[0.2em] uppercase mb-1">💡 Example</div>
                                    <p className="text-xs text-white/70 leading-relaxed">{flashcards[currentIndex].example}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6 mt-8">
                    <button onClick={prevCard} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/20 text-white flex items-center justify-center transition-colors"><FaArrowLeft /></button>
                    <span className="text-white/40 text-xs font-mono">{currentIndex + 1} / {flashcards.length}</span>
                    <button onClick={nextCard} className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-purple-500/30 flex items-center justify-center hover:scale-105 transition-transform"><FaArrowRight /></button>
                </div>
            </div>
        </div>
    );

    // 2. Generator Form (Inside Modal)
    const renderGeneratorForm = () => (
        <div className="space-y-5">
            <div>
                <label className="text-xs text-white/60 uppercase tracking-wider font-bold block mb-2">Topic</label>
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Quantum Physics"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-purple-500/50"
                    onKeyDown={(e) => e.key === 'Enter' && generateFlashcards()}
                />
            </div>

            <div>
                <label className="text-xs text-white/60 uppercase tracking-wider font-bold block mb-2">Language</label>
                <div className="flex gap-2">
                    {(['english', 'hindi', 'hinglish'] as const).map((lang) => (
                        <button
                            key={lang}
                            onClick={() => setLanguage(lang)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-all ${language === lang ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                        >
                            {lang === 'english' ? '🇬🇧 Eng' : lang === 'hindi' ? '🇮🇳 Hin' : '🌐 Hing'}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={generateFlashcards}
                disabled={loading || !topic.trim()}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50"
            >
                {loading ? <FaSpinner className="animate-spin" /> : <>Generate <FaLightbulb /></>}
            </button>

            {savedSets.length > 0 && (
                <div className="pt-4 border-t border-white/10">
                    <p className="text-[10px] font-bold text-white/40 uppercase mb-2">Recent</p>
                    <div className="flex flex-wrap gap-2">
                        {savedSets.map((set, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 transition-all cursor-pointer">
                                <button onClick={() => loadSet(set)} className="text-xs text-white/80 font-medium hover:text-white">{set.topic}</button>
                                <button onClick={(e) => { e.stopPropagation(); deleteSet(idx); }} className="text-white/20 hover:text-red-400"><FaTrash className="text-[10px]" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(true)}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
            >
                <FaLightbulb className="text-xl" />
                <div className="text-left">
                    <p className="font-bold">Flashcard Generator</p>
                    <p className="text-xs opacity-80">Memorize topics faster</p>
                </div>
                <FaArrowRight className="ml-auto text-white/50" />
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-md bg-gradient-to-br from-[#1a1330] to-[#0f0a1f] rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 p-4 border-b border-white/10 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                        <FaLightbulb className="text-white text-lg" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm">Flashcards</h3>
                                        <p className="text-[10px] text-white/50">AI Powered Memory Aid</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"><FaTimes className="text-white/60" /></button>
                            </div>

                            <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
                                {(!showGenerator && flashcards.length > 0) ? renderFlashcardView() : renderGeneratorForm()}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

