'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaTimes, FaLightbulb, FaSpinner, FaBrain, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';

interface AIExplanationModalProps {
    isOpen: boolean;
    onClose: () => void;
    question: string;
    options: string[];
    correctAnswer: number;
    userAnswer: number;
    subject?: string;
    chapter?: string;
}

interface ExplanationSections {
    concept?: string;
    whyWrong?: string;
    whyCorrect?: string;
    trick?: string;
}

function parseExplanation(raw: string): { sections: ExplanationSections | null; plainText: string } {
    try {
        const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.concept || parsed.whyWrong || parsed.whyCorrect || parsed.trick) {
            return { sections: parsed, plainText: '' };
        }
    } catch { }
    return { sections: null, plainText: raw };
}

export const AIExplanationModal: React.FC<AIExplanationModalProps> = ({
    isOpen, onClose, question, options, correctAnswer, userAnswer, subject, chapter
}) => {
    const [loading, setLoading] = useState(false);
    const [explanation, setExplanation] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && !explanation && !loading) fetchExplanation();
    }, [isOpen]);

    const fetchExplanation = async () => {
        setLoading(true);
        setError(null);
        try {
            const hasHindiChars = /[ऀ-ॿ]/.test(question) || options.some(opt => /[ऀ-ॿ]/.test(opt));
            const preferredLanguage = hasHindiChars ? 'hindi' : 'hinglish';

            const response = await fetch('/api/ai/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, options, correctAnswer, userAnswer, subject, chapter, preferredLanguage })
            });
            const data = await response.json();
            if (data.success) {
                setExplanation(data.explanation);
            } else {
                setError(data.error || 'Failed to get explanation');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => { setExplanation(null); setError(null); onClose(); };

    const { sections, plainText } = explanation ? parseExplanation(explanation) : { sections: null, plainText: '' };
    const optionLabels = ['A', 'B', 'C', 'D'];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ y: 60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 60, opacity: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center">
                                        <FaRobot className="text-white text-base" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-base leading-tight">AI Tutor</h3>
                                        <p className="text-[11px] text-white/60">Groq · {subject || 'General'}{chapter ? ` · ${chapter}` : ''}</p>
                                    </div>
                                </div>
                                <button onClick={handleClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                                    <FaTimes className="text-white text-sm" />
                                </button>
                            </div>

                            {/* Answer comparison inline in header */}
                            <div className="flex gap-2 mt-3">
                                <div className="flex-1 bg-red-500/20 border border-red-400/30 rounded-xl px-3 py-2">
                                    <p className="text-[10px] text-red-200 uppercase tracking-wider mb-0.5">Tumhara Jawab</p>
                                    <p className="text-white text-sm font-bold truncate">{optionLabels[userAnswer]}) {options[userAnswer]}</p>
                                </div>
                                <div className="flex-1 bg-green-500/20 border border-green-400/30 rounded-xl px-3 py-2">
                                    <p className="text-[10px] text-green-200 uppercase tracking-wider mb-0.5">Sahi Jawab</p>
                                    <p className="text-white text-sm font-bold truncate">{optionLabels[correctAnswer]}) {options[correctAnswer]}</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 max-h-[55vh] overflow-y-auto space-y-3 bg-white dark:bg-slate-900">
                            {loading && (
                                <div className="flex flex-col items-center justify-center py-10 gap-4">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                            <FaSpinner className="text-2xl text-indigo-500 animate-spin" />
                                        </div>
                                        <motion.div
                                            className="absolute inset-0 rounded-2xl border-2 border-indigo-300"
                                            animate={{ opacity: [1, 0], scale: [1, 1.4] }}
                                            transition={{ repeat: Infinity, duration: 1.2 }}
                                        />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-gray-700">AI soch raha hai...</p>
                                        <p className="text-xs text-gray-400 mt-1">Explanation generate ho rahi hai 🤔</p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                                    <p className="text-red-500 font-medium text-sm">{error}</p>
                                    <button onClick={fetchExplanation} className="mt-2 px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 text-sm rounded-lg transition-colors font-medium">
                                        Dobara Try Karo
                                    </button>
                                </div>
                            )}

                            {explanation && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-3"
                                >
                                    {sections ? (
                                        <>
                                            {sections.concept && (
                                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                                                    className="bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 rounded-2xl p-3.5">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <FaBrain className="text-indigo-500 text-sm" />
                                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">Concept</span>
                                                    </div>
                                                    <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed">{sections.concept}</p>
                                                </motion.div>
                                            )}

                                            {sections.whyWrong && (
                                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                                    className="bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-2xl p-3.5">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <FaTimesCircle className="text-red-500 text-sm" />
                                                        <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">Galti Kahan Hui</span>
                                                    </div>
                                                    <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed">{sections.whyWrong}</p>
                                                </motion.div>
                                            )}

                                            {sections.whyCorrect && (
                                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                                                    className="bg-green-50 dark:bg-green-950/40 border border-green-100 dark:border-green-900/50 rounded-2xl p-3.5">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <FaCheckCircle className="text-green-500 text-sm" />
                                                        <span className="text-[10px] font-black text-green-600 uppercase tracking-wider">Sahi Jawab Kyu</span>
                                                    </div>
                                                    <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed">{sections.whyCorrect}</p>
                                                </motion.div>
                                            )}

                                            {sections.trick && (
                                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                                    className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-3.5">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <FaLightbulb className="text-amber-500 text-sm" />
                                                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Exam Trick</span>
                                                    </div>
                                                    <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed font-medium">{sections.trick}</p>
                                                </motion.div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <HiSparkles className="text-indigo-500" />
                                                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Explanation</span>
                                            </div>
                                            <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{plainText}</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>

                        {/* Footer */}
                        {explanation && (
                            <div className="px-4 pb-5 pt-2 bg-white dark:bg-slate-900 border-t border-pw-border">
                                <button
                                    onClick={handleClose}
                                    className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200 active:scale-95 text-sm"
                                >
                                    Samajh Gaya! 👍
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
