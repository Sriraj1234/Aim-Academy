'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaTimesCircle, FaEye, FaTrash, FaLightbulb, FaFlask, FaCalculator, FaGlobeAmericas, FaLanguage, FaBook } from 'react-icons/fa';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { AIExplainButton } from '@/components/quiz/AIExplainButton';

interface MistakeProps {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    userAnswer: number;
    subject: string;
    chapter: string;
    timestamp: number;
    onRemove: (id: string) => void;
}

const subjectIcons: Record<string, any> = {
    science: FaFlask,
    math: FaCalculator,
    sst: FaGlobeAmericas,
    hindi: FaLanguage,
    english: FaBook
};

export const MistakeCard: React.FC<MistakeProps> = ({
    id, question, options, correctAnswer, userAnswer, subject, chapter, timestamp, onRemove
}) => {
    const { user } = useAuth();
    const [revealed, setRevealed] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleMastered = async () => {
        if (!user) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'mistakes', id));
            onRemove(id); // Optimistic UI update
        } catch (error) {
            console.error("Failed to remove mistake:", error);
            setIsDeleting(false);
        }
    };

    const Icon = subjectIcons[subject?.toLowerCase()] || FaBook;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="bg-white rounded-2xl border border-pw-border shadow-sm hover:shadow-pw-md transition-all overflow-hidden flex flex-col"
        >
            <div className="p-5 flex-1 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1 text-pw-indigo bg-pw-surface px-2 py-1 rounded-md">
                            <Icon size={12} /> {subject}
                        </span>
                        <span>•</span>
                        <span className="line-clamp-1">{chapter}</span>
                    </div>
                </div>

                {/* Question */}
                <h3 className="text-gray-800 font-bold text-lg leading-snug">{question}</h3>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mt-2">
                    {options.map((opt, idx) => {
                        const isUserWrong = idx === userAnswer;
                        const isCorrect = idx === correctAnswer;

                        let cardClass = "border-gray-200 bg-gray-50 text-gray-500 opacity-60"; // Default dimmed

                        if (isUserWrong) {
                            cardClass = "border-red-200 bg-red-50 text-red-600 font-bold opacity-100 ring-1 ring-red-100";
                        } else if (revealed && isCorrect) {
                            cardClass = "border-green-200 bg-green-50 text-green-700 font-bold opacity-100 ring-1 ring-green-100";
                        } else if (!revealed && isCorrect) {
                            // Keep it hidden/neutral until revealed
                            cardClass = "border-gray-200 bg-gray-50 text-gray-500 opacity-60";
                        }

                        return (
                            <div key={idx} className={`p-3 rounded-xl border ${cardClass} flex items-center justify-between transition-all`}>
                                <span>{opt}</span>
                                {isUserWrong && <FaTimesCircle className="text-red-500 shrink-0" />}
                                {revealed && isCorrect && <FaCheckCircle className="text-green-500 shrink-0" />}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 p-3 border-t border-pw-border flex flex-wrap gap-3">
                <button
                    onClick={() => setRevealed(!revealed)}
                    className="flex-1 min-w-[120px] py-2.5 rounded-xl bg-white border border-pw-border text-pw-violet font-bold text-sm hover:bg-pw-surface transition-colors flex items-center justify-center gap-2"
                >
                    {revealed ? <><FaLightbulb /> Hide Answer</> : <><FaEye /> Reveal Answer</>}
                </button>

                {/* AI Explain Button */}
                <div className="flex-1 min-w-[120px] flex justify-center">
                    <AIExplainButton
                        question={question}
                        options={options}
                        correctAnswer={correctAnswer}
                        userAnswer={userAnswer}
                        subject={subject}
                    />
                </div>

                <button
                    onClick={handleMastered}
                    disabled={isDeleting}
                    className="flex-1 min-w-[120px] py-2.5 rounded-xl bg-green-500 hover:bg-green-600 border border-green-600 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                    {isDeleting ? "Removing..." : <><FaCheckCircle /> Mastered It!</>}
                </button>
            </div>
        </motion.div>
    );
};
