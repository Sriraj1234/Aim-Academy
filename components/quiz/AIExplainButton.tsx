'use client';

import React, { useState } from 'react';
import { FaRobot, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface AIExplainButtonProps {
    question: string;
    options: string[];
    correctAnswer: number;
    userAnswer: number;
    subject: string;
}

export const AIExplainButton: React.FC<AIExplainButtonProps> = ({
    question,
    options,
    correctAnswer,
    userAnswer,
    subject
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [explanation, setExplanation] = useState('');
    const [tip, setTip] = useState('');
    const [loading, setLoading] = useState(false);

    const handleExplain = async () => {
        setIsOpen(true);
        if (explanation) return; // Already fetched

        setLoading(true);
        try {
            const response = await fetch('/api/ai/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    options,
                    correctAnswer,
                    userAnswer,
                    subject
                })
            });

            const data = await response.json();
            if (data.success) {
                setExplanation(data.explanation);
                setTip(data.tip);
            } else {
                setExplanation("Sorry, I couldn't explain this right now.");
            }
        } catch {
            setExplanation("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={handleExplain}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition-colors border border-indigo-200"
            >
                <FaRobot />
                Why is this wrong?
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative"
                        >
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                            >
                                <FaTimes />
                            </button>

                            <div className="flex items-center gap-3 mb-4 text-indigo-600">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                                    <FaRobot className="text-xl" />
                                </div>
                                <h3 className="text-lg font-bold font-display">AI Explanation</h3>
                            </div>

                            {loading ? (
                                <div className="py-8 text-center space-y-3">
                                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                                    <p className="text-sm text-gray-500 font-medium">Analyzing your mistake...</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Why Your Answer Was incorrect</h4>
                                        <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed border border-gray-100">
                                            {explanation}
                                        </div>
                                    </div>

                                    {tip && (
                                        <div>
                                            <h4 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Correction Tip</h4>
                                            <div className="bg-green-50 p-3 rounded-xl text-sm text-green-800 border border-green-100 font-medium">
                                                💡 {tip}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
