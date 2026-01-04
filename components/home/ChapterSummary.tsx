'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBook, FaTimes, FaSpinner, FaLightbulb, FaCalculator, FaCalendarAlt, FaBrain, FaGraduationCap, FaGlobe, FaExternalLinkAlt } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

interface Summary {
    title: string;
    keyPoints: string[];
    definitions: { term: string; meaning: string }[];
    formulas: string[];
    importantDates: { event: string; date: string }[];
    mnemonics: string[];
    examTips: string[];
}

interface ChapterSummaryProps {
    subject?: string;
    chapter?: string;
}

const SUBJECTS = [
    'Physics', 'Chemistry', 'Biology', 'Mathematics',
    'History', 'Geography', 'Economics', 'Political Science'
];

export const ChapterSummary: React.FC<ChapterSummaryProps> = ({ subject: initialSubject, chapter: initialChapter }) => {
    const { userProfile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [subject, setSubject] = useState(initialSubject || '');
    const [chapter, setChapter] = useState(initialChapter || '');
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [error, setError] = useState('');
    const [useWebResearch, setUseWebResearch] = useState(false);
    const [sources, setSources] = useState<string[]>([]);

    const generateSummary = async () => {
        if (!subject || !chapter.trim()) {
            setError('Please select subject and enter chapter name');
            return;
        }

        setLoading(true);
        setError('');
        setSummary(null);

        try {
            const response = await fetch('/api/ai/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject,
                    chapter,
                    language: 'hinglish',
                    classLevel: userProfile?.class || '10',
                    board: userProfile?.board || 'CBSE',
                    name: userProfile?.displayName,
                    useWebResearch
                })
            });

            const data = await response.json();

            if (data.success && data.summary) {
                setSummary(data.summary);
                if (data.sources) {
                    setSources(data.sources);
                }
            } else {
                setError(data.error || 'Failed to generate summary');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetState = () => {
        if (!initialSubject) setSubject('');
        if (!initialChapter) setChapter('');
        setSummary(null);
        setError('');
        setSources([]);
    };

    return (
        <>
            {/* Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(true)}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
            >
                <FaBook className="text-xl" />
                <div className="text-left">
                    <p className="font-bold">Quick Revision Notes</p>
                    <p className="text-xs opacity-80">AI-generated chapter summary</p>
                </div>
                <FaBrain className="ml-auto text-yellow-300" />
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => { setIsOpen(false); resetState(); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-lg bg-gradient-to-br from-[#1a1330] to-[#0f0a1f] rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 p-4 border-b border-white/10 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                        <FaBook className="text-white text-lg" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm">Chapter Summary</h3>
                                        <p className="text-[10px] text-white/50">AI-powered revision notes</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setIsOpen(false); resetState(); }}
                                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
                                >
                                    <FaTimes className="text-white/60 text-sm" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-5 space-y-5 overflow-y-auto flex-1">
                                {!summary ? (
                                    <>
                                        {/* Subject Selection */}
                                        <div>
                                            <label className="text-xs text-white/60 uppercase tracking-wider font-bold block mb-2">
                                                Select Subject *
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {SUBJECTS.map((s) => (
                                                    <button
                                                        key={s}
                                                        onClick={() => setSubject(s)}
                                                        className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${subject === s
                                                            ? 'bg-emerald-600 text-white'
                                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Chapter Input */}
                                        <div>
                                            <label className="text-xs text-white/60 uppercase tracking-wider font-bold block mb-2">
                                                Chapter Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={chapter}
                                                onChange={(e) => setChapter(e.target.value)}
                                                placeholder="e.g., Photosynthesis, The French Revolution..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-emerald-500/50"
                                            />
                                        </div>

                                        {error && (
                                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center text-red-400 text-sm">
                                                {error}
                                            </div>
                                        )}

                                        {/* Web Research Toggle */}
                                        <div className="flex items-center gap-3 p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                                            <button
                                                type="button"
                                                onClick={() => setUseWebResearch(!useWebResearch)}
                                                className={`w-12 h-6 rounded-full transition-all relative ${useWebResearch ? 'bg-cyan-500' : 'bg-white/10'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${useWebResearch ? 'left-7' : 'left-1'}`} />
                                            </button>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 text-sm font-bold text-cyan-400">
                                                    <FaGlobe /> Web Research
                                                </div>
                                                <p className="text-[10px] text-white/50">Fetch extra context from the web (takes longer)</p>
                                            </div>
                                        </div>

                                        {/* Generate Button */}
                                        <button
                                            onClick={generateSummary}
                                            disabled={loading || !subject || !chapter.trim()}
                                            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
                                        >
                                            {loading ? (
                                                <>
                                                    <FaSpinner className="animate-spin" />
                                                    <span>Generating Notes...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FaBrain />
                                                    <span>Generate Summary</span>
                                                </>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    /* Summary Display */
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-lg font-bold text-white">{summary.title || chapter}</h4>
                                            <button
                                                onClick={resetState}
                                                className="text-xs text-white/40 hover:text-white/60"
                                            >
                                                New Summary
                                            </button>
                                        </div>

                                        {/* Key Points */}
                                        {summary.keyPoints?.length > 0 && (
                                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                                                <h5 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <FaLightbulb /> Key Points
                                                </h5>
                                                <ul className="space-y-1.5">
                                                    {summary.keyPoints.map((point, i) => (
                                                        <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                                                            <span className="text-purple-400">•</span>
                                                            {point}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Definitions */}
                                        {summary.definitions?.length > 0 && (
                                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                                                <h5 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <FaGraduationCap /> Definitions
                                                </h5>
                                                <div className="space-y-2">
                                                    {summary.definitions.map((def, i) => (
                                                        <div key={i} className="text-sm">
                                                            <span className="font-bold text-blue-300">{def.term}:</span>
                                                            <span className="text-white/70 ml-1">{def.meaning}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Formulas */}
                                        {summary.formulas?.length > 0 && (
                                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                                                <h5 className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <FaCalculator /> Formulas
                                                </h5>
                                                <div className="space-y-1.5">
                                                    {summary.formulas.map((formula, i) => (
                                                        <p key={i} className="text-sm text-white/80 font-mono bg-black/20 px-2 py-1 rounded">
                                                            {formula}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Important Dates */}
                                        {summary.importantDates?.length > 0 && (
                                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                                <h5 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <FaCalendarAlt /> Important Dates
                                                </h5>
                                                <div className="space-y-1.5">
                                                    {summary.importantDates.map((item, i) => (
                                                        <div key={i} className="text-sm flex justify-between">
                                                            <span className="text-white/70">{item.event}</span>
                                                            <span className="font-bold text-red-300">{item.date}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Mnemonics */}
                                        {summary.mnemonics?.length > 0 && (
                                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                                <h5 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <FaBrain /> Memory Tricks
                                                </h5>
                                                <ul className="space-y-1.5">
                                                    {summary.mnemonics.map((mnemonic, i) => (
                                                        <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                                                            <span className="text-green-400">💡</span>
                                                            {mnemonic}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Exam Tips */}
                                        {summary.examTips?.length > 0 && (
                                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                                                <h5 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">
                                                    📝 Exam Tips
                                                </h5>
                                                <ul className="space-y-1.5">
                                                    {summary.examTips.map((tip, i) => (
                                                        <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                                                            <span className="text-orange-400">✓</span>
                                                            {tip}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Web Sources */}
                                        {sources.length > 0 && (
                                            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                                                <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <FaGlobe /> Web Sources
                                                </h5>
                                                <div className="space-y-1.5">
                                                    {sources.slice(0, 3).map((url, i) => {
                                                        let hostname = "";
                                                        try { hostname = new URL(url).hostname; } catch { }
                                                        return (
                                                            <a
                                                                key={i}
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-cyan-300/80 hover:text-cyan-200 flex items-center gap-1 truncate"
                                                            >
                                                                <FaExternalLinkAlt className="text-[10px] shrink-0" />
                                                                {hostname || url}
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
