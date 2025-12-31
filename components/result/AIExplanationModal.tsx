'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaTimes, FaLightbulb, FaSpinner } from 'react-icons/fa';

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

export const AIExplanationModal: React.FC<AIExplanationModalProps> = ({
    isOpen,
    onClose,
    question,
    options,
    correctAnswer,
    userAnswer,
    subject,
    chapter
}) => {
    const [loading, setLoading] = useState(false);
    const [explanation, setExplanation] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && !explanation && !loading) {
            fetchExplanation();
        }
    }, [isOpen]);

    const fetchExplanation = async () => {
        setLoading(true);
        setError(null);

        try {
            // Auto-detect language preference
            // If question or options contain Devanagari characters, prefer Hindi
            const hasHindiChars = /[\u0900-\u097F]/.test(question) || options.some(opt => /[\u0900-\u097F]/.test(opt));
            const preferredLanguage = hasHindiChars ? 'hindi' : 'hinglish';

            const response = await fetch('/api/ai/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    options,
                    correctAnswer,
                    userAnswer,
                    subject,
                    chapter,
                    preferredLanguage
                })
            });

            const data = await response.json();

            if (data.success) {
                setExplanation(data.explanation);
            } else {
                setError(data.error || 'Failed to get explanation');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setExplanation(null);
        setError(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-pw-violet/20 backdrop-blur-sm"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="w-full max-w-md bg-white rounded-3xl border border-pw-border shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="relative bg-gradient-to-r from-pw-violet to-pw-indigo p-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-lg backdrop-blur-md">
                                    <FaRobot className="text-white text-lg" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">AI Explanation</h3>
                                    <p className="text-xs text-white/70">Powered by Groq AI</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                            >
                                <FaTimes className="text-white" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 max-h-[60vh] overflow-y-auto">
                            {loading && (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full bg-pw-indigo/10 flex items-center justify-center">
                                            <FaSpinner className="text-2xl text-pw-indigo animate-spin" />
                                        </div>
                                        <div className="absolute inset-0 rounded-full bg-pw-indigo/10 animate-ping" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-pw-violet font-medium">Analyzing your answer...</p>
                                        <p className="text-xs text-pw-indigo/60 mt-1">AI is thinking 🤔</p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                                    <p className="text-red-500 font-medium">{error}</p>
                                    <button
                                        onClick={fetchExplanation}
                                        className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 text-sm rounded-lg transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}

                            {explanation && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4"
                                >
                                    {/* Question Summary */}
                                    <div className="bg-pw-surface rounded-2xl p-4 border border-pw-border">
                                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Question</p>
                                        <p className="text-pw-violet text-sm leading-relaxed line-clamp-3 font-medium">{question}</p>
                                    </div>

                                    {/* Answer Comparison */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                            <p className="text-[10px] text-red-500/70 uppercase tracking-wider mb-1">Your Answer</p>
                                            <p className="text-red-600 text-sm font-bold line-clamp-2">{options[userAnswer]}</p>
                                        </div>
                                        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                                            <p className="text-[10px] text-green-500/70 uppercase tracking-wider mb-1">Correct Answer</p>
                                            <p className="text-green-600 text-sm font-bold line-clamp-2">{options[correctAnswer]}</p>
                                        </div>
                                    </div>

                                    {/* AI Explanation */}
                                    <div className="bg-gradient-to-br from-pw-indigo/5 to-pw-violet/5 rounded-2xl p-4 border border-pw-indigo/10">
                                        <div className="flex items-center gap-2 mb-3">
                                            <FaLightbulb className="text-yellow-500" />
                                            <span className="text-xs text-pw-indigo uppercase tracking-wider font-bold">Explanation</span>
                                        </div>
                                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                            {explanation}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer */}
                        {explanation && (
                            <div className="p-4 border-t border-pw-border bg-gray-50/50">
                                <button
                                    onClick={handleClose}
                                    className="w-full py-3 bg-pw-indigo hover:bg-pw-violet text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
                                >
                                    Got it! 👍
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
