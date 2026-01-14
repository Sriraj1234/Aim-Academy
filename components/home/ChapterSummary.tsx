'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBook, FaTimes, FaSpinner, FaLightbulb, FaCalculator, FaCalendarAlt, FaBrain, FaGraduationCap, FaGlobe, FaExternalLinkAlt, FaImage, FaMagic } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { UpgradeModal } from '@/components/subscription/UpgradeModal'; // Fix import path
import ReactMarkdown from 'react-markdown';

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
    'Physics', 'Chemistry', 'Biology',
    'History', 'Geography', 'Economics', 'Political Science'
];

export const ChapterSummary: React.FC<ChapterSummaryProps> = ({ subject: initialSubject, chapter: initialChapter }) => {
    const { userProfile, checkAccess, incrementUsage } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [subject, setSubject] = useState(initialSubject || '');
    const [chapter, setChapter] = useState(initialChapter || '');
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [error, setError] = useState('');
    const [language, setLanguage] = useState<'english' | 'hindi' | 'hinglish'>('hinglish');
    const [useWebResearch, setUseWebResearch] = useState(false);
    const [sources, setSources] = useState<string[]>([]);
    const [images, setImages] = useState<any[]>([]);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const generateSummary = async () => {
        if (!subject || !chapter.trim()) {
            setError('Please select subject and enter chapter name');
            return;
        }

        if (!checkAccess('note_gen')) {
            setShowUpgradeModal(true);
            return;
        }

        setLoading(true);
        setError('');
        setSummary(null);
        setImages([]);

        try {
            const response = await fetch('/api/ai/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject,
                    chapter,
                    language,
                    classLevel: userProfile?.class || '10',
                    board: userProfile?.board || 'CBSE',
                    name: userProfile?.displayName,
                    useWebResearch
                })
            });

            const data = await response.json();

            if (data.success && data.summary) {
                setSummary(data.summary);
                if (data.sources) setSources(data.sources);
                if (data.images) setImages(data.images); // Set images
                incrementUsage('note_gen');
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
        setImages([]);
        setLanguage('hinglish');
    };

    return (
        <>
            {/* Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(true)}
                className="w-full relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-[1px] rounded-2xl shadow-xl shadow-purple-500/20"
            >
                <div className="bg-[#0f0a1f]/90 backdrop-blur-xl p-4 rounded-2xl flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <FaMagic className="text-white text-xl" />
                    </div>
                    <div className="text-left flex-1">
                        <p className="font-bold text-white text-lg group-hover:text-purple-300 transition-colors">AI Notes Generator</p>
                        <p className="text-xs text-white/60">Instant Visual Summary & Cheat-sheets</p>
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
                        className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md"
                        onClick={() => { setIsOpen(false); resetState(); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full max-w-2xl h-full md:h-auto md:max-h-[90vh] bg-[#0f0a1f] md:rounded-3xl border-0 md:border border-white/10 shadow-2xl overflow-hidden flex flex-col relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Decorative Gradients */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

                            {/* Header */}
                            <div className="p-4 md:p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/5 backdrop-blur-xl z-10">
                                <div>
                                    <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 text-lg md:text-xl">
                                        AI Quick Revision
                                    </h3>
                                    <p className="text-[10px] md:text-[11px] text-white/50 font-medium tracking-wide uppercase">Generative Learning Engine</p>
                                </div>
                                <button
                                    onClick={() => { setIsOpen(false); resetState(); }}
                                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                >
                                    <FaTimes className="text-white/60" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4 md:p-6 overflow-y-auto flex-1 z-10 custom-scrollbar">
                                {!summary ? (
                                    <div className="space-y-6">
                                        {/* Setup Form */}
                                        <div className="space-y-4">
                                            <label className="text-xs text-purple-300 font-bold uppercase tracking-wider block">Subject</label>
                                            <div className="flex flex-wrap gap-2">
                                                {SUBJECTS.map((s) => (
                                                    <button
                                                        key={s}
                                                        onClick={() => setSubject(s)}
                                                        className={`px-3 py-2 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${subject === s
                                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                                                            : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/5'
                                                            }`}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs text-purple-300 font-bold uppercase tracking-wider block">Chapter Name</label>
                                            <input
                                                type="text"
                                                value={chapter}
                                                onChange={(e) => setChapter(e.target.value)}
                                                placeholder="e.g., Rise of Nationalism in Europe"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-base placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs text-purple-300 font-bold uppercase tracking-wider block">Language</label>
                                                <div className="flex bg-white/5 p-1 rounded-xl">
                                                    {['english', 'hinglish', 'hindi'].map((lang) => (
                                                        <button
                                                            key={lang}
                                                            onClick={() => setLanguage(lang as any)}
                                                            className={`flex-1 py-1.5 capitalize text-xs font-bold rounded-lg transition-all ${language === lang ? 'bg-purple-500 text-white shadow' : 'text-white/40 hover:text-white'}`}
                                                        >
                                                            {lang}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs text-cyan-300 font-bold uppercase tracking-wider block">Enhancements</label>
                                                <button
                                                    onClick={() => setUseWebResearch(!useWebResearch)}
                                                    className={`w-full py-2 px-3 rounded-xl border flex items-center gap-2 transition-all ${useWebResearch ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-white/5 border-transparent text-white/40'}`}
                                                >
                                                    <FaGlobe className={useWebResearch ? 'animate-pulse' : ''} />
                                                    <span className="text-xs font-bold">Web & Images</span>
                                                </button>
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-medium">
                                                {error}
                                            </div>
                                        )}

                                        <button
                                            onClick={generateSummary}
                                            disabled={loading || !subject || !chapter.trim()}
                                            className="w-full py-3 md:py-4 mt-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale transition-all hover:shadow-lg hover:shadow-purple-500/25 active:scale-95"
                                        >
                                            {loading ? (
                                                <>
                                                    <FaSpinner className="animate-spin" />
                                                    <span>{useWebResearch ? 'Searching Web & Images...' : 'Generating Notes...'}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FaMagic />
                                                    <span>Generate Visual Notes</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    /* Summary Display */
                                    <div className="space-y-6">
                                        <div className="text-center pb-4 border-b border-white/10">
                                            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">{summary.title || chapter}</h2>
                                            <span className="inline-block px-3 py-1 rounded-full bg-white/5 text-xs text-purple-300 font-medium">
                                                Based on Class {userProfile?.class || 10} Syllabus
                                            </span>
                                        </div>

                                        {/* Image Gallery */}
                                        {images && images.length > 0 && (
                                            <div className="space-y-3">
                                                <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                                                    <FaImage /> Visuals & Diagrams
                                                </h5>
                                                <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar snap-x">
                                                    {images.map((img, i) => (
                                                        <div key={i} className="snap-center shrink-0 w-64 aspect-video bg-black/40 rounded-xl overflow-hidden border border-white/10 relative group">
                                                            <img
                                                                src={img.original || img.url}
                                                                alt={img.title}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                            />
                                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8">
                                                                <p className="text-xs text-white line-clamp-1">{img.title}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Key Points (Markdown) */}
                                        {summary.keyPoints?.length > 0 && (
                                            <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/20 rounded-2xl p-4 md:p-5">
                                                <h5 className="text-sm font-bold text-purple-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                    <FaLightbulb className="text-yellow-400" /> Key Concepts
                                                </h5>
                                                <ul className="space-y-4">
                                                    {summary.keyPoints.map((point, i) => (
                                                        <li key={i} className="text-[14px] md:text-[15px] leading-relaxed text-white/90 flex gap-3">
                                                            <span className="text-purple-500 text-lg leading-none">•</span>
                                                            <div className="prose prose-invert prose-sm max-w-none prose-p:my-0 prose-strong:text-purple-200 prose-strong:font-bold">
                                                                <ReactMarkdown>{point}</ReactMarkdown>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Definitions */}
                                            {summary.definitions?.length > 0 && (
                                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 md:p-5">
                                                    <h5 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                        <FaGraduationCap /> Vocabulary
                                                    </h5>
                                                    <div className="space-y-3">
                                                        {summary.definitions.map((def, i) => (
                                                            <div key={i} className="text-sm">
                                                                <span className="font-bold text-blue-200 block mb-1">{def.term}</span>
                                                                <span className="text-white/70 text-xs leading-relaxed">{def.meaning}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Formulas / Dates */}
                                            <div className="space-y-4">
                                                {summary.formulas?.length > 0 && (
                                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 md:p-5">
                                                        <h5 className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                            <FaCalculator /> Formulas
                                                        </h5>
                                                        <div className="space-y-2">
                                                            {summary.formulas.map((formula, i) => (
                                                                <div key={i} className="text-sm text-white/90 font-mono bg-black/30 px-3 py-2 rounded-lg border border-white/5">
                                                                    {formula}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {summary.importantDates?.length > 0 && (
                                                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 md:p-5">
                                                        <h5 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                            <FaCalendarAlt /> Timeline
                                                        </h5>
                                                        <div className="space-y-2">
                                                            {summary.importantDates.map((item, i) => (
                                                                <div key={i} className="text-sm flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                                                    <span className="text-white/70">{item.event}</span>
                                                                    <span className="font-bold text-red-300 bg-red-500/10 px-2 py-0.5 rounded text-xs">{item.date}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Mnemonics & Tips */}
                                        <div className="grid grid-cols-1 gap-4">
                                            {summary.mnemonics?.length > 0 && (
                                                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 md:p-5 relative overflow-hidden">
                                                    <div className="absolute -right-4 -top-4 text-6xl text-green-500/5 rotate-12">
                                                        <FaBrain />
                                                    </div>
                                                    <h5 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2 relative z-10">
                                                        <FaBrain /> Brain Hacks (Mnemonics)
                                                    </h5>
                                                    <ul className="space-y-2 relative z-10">
                                                        {summary.mnemonics.map((mnemonic, i) => (
                                                            <li key={i} className="text-sm text-green-100/90 italic flex gap-2">
                                                                <span>💡</span>
                                                                {mnemonic}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {summary.examTips?.length > 0 && (
                                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 md:p-5">
                                                    <h5 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3 w-full border-b border-orange-500/20 pb-2">
                                                        Exam Strategy
                                                    </h5>
                                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {summary.examTips.map((tip, i) => (
                                                            <li key={i} className="text-xs text-white/80 flex items-start gap-2 bg-black/20 p-2 rounded-lg">
                                                                <span className="text-orange-400 font-bold">!</span>
                                                                {tip}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        {/* Sources */}
                                        {sources.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                                                <span className="text-[10px] text-white/40 uppercase font-bold self-center mr-2">Sources:</span>
                                                {sources.slice(0, 3).map((url, i) => {
                                                    let hostname = "Link";
                                                    try { hostname = new URL(url).hostname.replace('www.', ''); } catch { }
                                                    return (
                                                        <a
                                                            key={i}
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[10px] text-white/60 transition-colors"
                                                        >
                                                            <FaExternalLinkAlt className="text-[8px]" />
                                                            {hostname}
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                featureName="Smart Notes Generator"
            />
        </>
    );
};
