'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question } from '@/data/types';
import { FaCheckCircle, FaTimesCircle, FaMinusCircle, FaFilter, FaListAlt, FaCheck, FaTimes, FaRobot } from 'react-icons/fa';
import { AIExplanationModal } from './AIExplanationModal';

interface ReviewListProps {
    questions: Question[];
    answers: (number | null)[];
}

interface SelectedQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
    userAnswer: number;
    subject?: string;
    chapter?: string;
}

export const ReviewList: React.FC<ReviewListProps> = ({ questions, answers }) => {
    const [filter, setFilter] = useState<'all' | 'incorrect' | 'correct' | 'skipped'>('all');
    const [showAIModal, setShowAIModal] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<SelectedQuestion | null>(null);

    const handleAIExplain = (q: Question, userAnswer: number) => {
        setSelectedQuestion({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            userAnswer: userAnswer,
            subject: q.subject,
            chapter: q.chapter
        });
        setShowAIModal(true);
    };

    // Calculate Stats
    const total = questions.length;
    const correctCount = questions.filter((q, i) => answers[i] === q.correctAnswer).length;
    const skippedCount = answers.filter((a, i) => i < questions.length && (a === null || a === undefined)).length;
    const incorrectCount = Math.max(0, total - correctCount - skippedCount);

    const filteredQuestions = questions.map((q, i) => ({ ...q, index: i, userAnswer: answers[i] }))
        .filter(item => {
            const isCorrect = item.userAnswer === item.correctAnswer;
            const isSkipped = item.userAnswer === null;

            if (filter === 'all') return true;
            if (filter === 'correct') return isCorrect;
            if (filter === 'incorrect') return !isCorrect && !isSkipped;
            if (filter === 'skipped') return isSkipped;
            return true;
        });

    const correctPct = total > 0 ? (correctCount / total) * 100 : 0;
    const incorrectPct = total > 0 ? (incorrectCount / total) * 100 : 0;
    const skippedPct = total > 0 ? (skippedCount / total) * 100 : 0;

    return (
        <div className="w-full space-y-4 pb-20">
            {/* Visual Summary Bar */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-pw-border shadow-pw-sm">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Performance Breakdown</span>
                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">{total} Questions</span>
                </div>

                {/* Segmented bar */}
                <div className="h-3 w-full rounded-full overflow-hidden flex gap-[2px] bg-gray-100 dark:bg-slate-700">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${correctPct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                        className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
                    />
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${incorrectPct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-red-400 to-rose-500 rounded-full"
                    />
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${skippedPct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                        className="h-full bg-gray-300 rounded-full"
                    />
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="flex flex-col items-center bg-green-50 dark:bg-green-900/25 border border-green-100 dark:border-green-800/50 rounded-xl py-2.5">
                        <span className="text-lg font-black text-green-600 dark:text-green-400">{correctCount}</span>
                        <span className="text-[10px] font-bold text-green-500 dark:text-green-500 uppercase tracking-wider">Correct</span>
                    </div>
                    <div className="flex flex-col items-center bg-red-50 dark:bg-red-900/25 border border-red-100 dark:border-red-800/50 rounded-xl py-2.5">
                        <span className="text-lg font-black text-red-500 dark:text-red-400">{incorrectCount}</span>
                        <span className="text-[10px] font-bold text-red-400 dark:text-red-500 uppercase tracking-wider">Wrong</span>
                    </div>
                    <div className="flex flex-col items-center bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-700 rounded-xl py-2.5">
                        <span className="text-lg font-black text-gray-500 dark:text-slate-400">{skippedCount}</span>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Skipped</span>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1.5 bg-gray-100 dark:bg-slate-800 rounded-2xl p-1.5">
                {[
                    { id: 'all', label: 'All', icon: FaListAlt, count: total, color: 'text-pw-indigo' },
                    { id: 'incorrect', label: 'Wrong', icon: FaTimesCircle, count: incorrectCount, color: 'text-red-500' },
                    { id: 'correct', label: 'Correct', icon: FaCheckCircle, count: correctCount, color: 'text-green-600' },
                    { id: 'skipped', label: 'Skipped', icon: FaMinusCircle, count: skippedCount, color: 'text-gray-500' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id as any)}
                        className={`
                            flex-1 px-2 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex flex-col items-center gap-0.5
                            ${filter === tab.id
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-pw-indigo'
                                : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'}
                        `}
                    >
                        <tab.icon className={`text-sm ${filter === tab.id ? tab.color : ''}`} />
                        <span className="whitespace-nowrap leading-tight">{tab.label}</span>
                        <span className={`text-[10px] font-black ${filter === tab.id ? tab.color : 'text-gray-300'}`}>({tab.count})</span>
                    </button>
                ))}
            </div>

            {/* Questions List */}
            <AnimatePresence mode="popLayout">
                {filteredQuestions.map((q) => {
                    const isCorrect = q.userAnswer === q.correctAnswer;
                    const isSkipped = q.userAnswer === null;
                    const isWrong = !isCorrect && !isSkipped;

                    return (
                        <motion.div
                            key={q.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            layout
                            className={`
                                rounded-3xl p-5 border shadow-pw-sm relative overflow-hidden group
                                ${isCorrect
                                    ? 'bg-gradient-to-br from-white dark:from-slate-800 to-green-50 dark:to-green-900/20 border-green-200 dark:border-green-800/50'
                                    : isWrong
                                        ? 'bg-gradient-to-br from-white dark:from-slate-800 to-red-50 dark:to-red-900/20 border-red-200 dark:border-red-800/50'
                                        : 'bg-white dark:bg-slate-800 border-pw-border'}
                            `}
                        >
                            {/* Difficulty Tag */}
                            <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-pw-surface border border-pw-border text-gray-500 dark:text-slate-400">
                                {q.difficulty || 'Medium'}
                            </div>

                            <div className="flex gap-3 sm:gap-4">
                                <div className={`
                                    w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold border
                                    ${isCorrect
                                        ? 'border-green-500 text-green-600 bg-green-100 dark:bg-green-900/40 dark:border-green-700'
                                        : isWrong
                                            ? 'border-red-500 text-red-600 bg-red-100 dark:bg-red-900/40 dark:border-red-700'
                                            : 'border-gray-300 dark:border-slate-600 text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700'}
                                `}>
                                    {isCorrect ? <FaCheck size={12} /> : isWrong ? <FaTimes size={12} /> : <FaMinusCircle size={12} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500 block mb-1">Question {q.index + 1}</span>
                                    <h3 className="text-sm sm:text-base font-semibold text-pw-violet leading-snug mb-3 pr-10">
                                        {q.question}
                                    </h3>

                                    <div className="flex flex-col gap-2 mt-3">
                                        {q.options.map((option, optIdx) => {
                                            const isSelected = q.userAnswer === optIdx;
                                            const isCorrectOption = q.correctAnswer === optIdx;

                                            let styles = "bg-pw-surface border-pw-border text-gray-600 dark:text-slate-300";
                                            let icon = null;

                                            if (isCorrectOption) {
                                                styles = "bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 font-bold shadow-sm";
                                                icon = <FaCheckCircle className="text-green-500 dark:text-green-400 text-base shrink-0" />;
                                            } else if (isSelected) {
                                                styles = "bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 line-through decoration-red-400/50";
                                                icon = <FaTimesCircle className="text-red-500 dark:text-red-400 text-base shrink-0" />;
                                            }

                                            return (
                                                <div
                                                    key={optIdx}
                                                    className={`relative p-3 rounded-xl border text-sm flex items-center gap-2 transition-all ${styles}`}
                                                >
                                                    <span className={`
                                                        w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold
                                                        ${isCorrectOption ? 'bg-green-500 dark:bg-green-600 text-white' :
                                                            isSelected ? 'bg-red-500 dark:bg-red-600 text-white' :
                                                                'bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-300'}
                                                    `}>
                                                        {String.fromCharCode(65 + optIdx)}
                                                    </span>
                                                    <span className="flex-1 min-w-0 break-words">{option}</span>
                                                    {icon}
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* AI Explain Button - Only for wrong answers */}
                                    {isWrong && q.userAnswer !== null && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => handleAIExplain(q, q.userAnswer as number)}
                                            className="mt-4 w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl flex items-center justify-center gap-2.5 text-white font-bold text-sm transition-all shadow-md shadow-indigo-200 active:scale-95"
                                        >
                                            <FaRobot className="text-white text-base" />
                                            <span>AI se Samjho</span>
                                            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">FREE</span>
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {filteredQuestions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 space-y-3">
                    <FaFilter className="text-4xl opacity-20" />
                    <p className="text-sm font-medium">No questions found in this filter.</p>
                </div>
            )}

            {/* AI Explanation Modal */}
            {selectedQuestion && (
                <AIExplanationModal
                    isOpen={showAIModal}
                    onClose={() => {
                        setShowAIModal(false);
                        setSelectedQuestion(null);
                    }}
                    question={selectedQuestion.question}
                    options={selectedQuestion.options}
                    correctAnswer={selectedQuestion.correctAnswer}
                    userAnswer={selectedQuestion.userAnswer}
                    subject={selectedQuestion.subject}
                    chapter={selectedQuestion.chapter}
                />
            )}
        </div>
    );
};
