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
    const skippedCount = answers.filter(a => a === null).length;
    const incorrectCount = total - correctCount - skippedCount;

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

    return (
        <div className="w-full space-y-6 pb-20">
            {/* Visual Summary Bar */}
            <div className="bg-pw-surface rounded-2xl p-4 border border-pw-border">
                <div className="flex justify-between text-xs text-gray-500 mb-2 uppercase tracking-wider font-bold">
                    <span>Performance Breakdown</span>
                    <span>{total} Questions</span>
                </div>
                <div className="h-4 w-full rounded-full overflow-hidden flex shadow-inner">
                    <div style={{ width: `${(correctCount / total) * 100}%` }} className="h-full bg-green-500" />
                    <div style={{ width: `${(incorrectCount / total) * 100}%` }} className="h-full bg-red-500" />
                    <div style={{ width: `${(skippedCount / total) * 100}%` }} className="h-full bg-gray-300" />
                </div>
                <div className="flex gap-4 mt-3 justify-center">
                    <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold">
                        <div className="w-2 h-2 rounded-full bg-green-500" /> Correct ({correctCount})
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-red-600 font-bold">
                        <div className="w-2 h-2 rounded-full bg-red-500" /> Incorrect ({incorrectCount})
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                        <div className="w-2 h-2 rounded-full bg-gray-400" /> Skipped ({skippedCount})
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 bg-white rounded-xl p-1 overflow-x-auto border border-pw-border no-scrollbar shadow-sm">
                {[
                    { id: 'all', label: 'All', icon: FaListAlt, count: total },
                    { id: 'incorrect', label: 'Wrong', icon: FaTimesCircle, count: incorrectCount },
                    { id: 'correct', label: 'Correct', icon: FaCheckCircle, count: correctCount },
                    { id: 'skipped', label: 'Skipped', icon: FaMinusCircle, count: skippedCount },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id as any)}
                        className={`
                            flex-1 min-w-[80px] px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1
                            ${filter === tab.id
                                ? 'bg-pw-indigo text-white shadow-md shadow-pw-indigo/20'
                                : 'text-gray-500 hover:bg-pw-surface hover:text-pw-indigo'}
                        `}
                    >
                        <tab.icon className="text-sm opacity-80" />
                        <span className="whitespace-nowrap">{tab.label} <span className="opacity-60">({tab.count})</span></span>
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
                                    ? 'bg-gradient-to-br from-white to-green-50 border-green-200'
                                    : isWrong
                                        ? 'bg-gradient-to-br from-white to-red-50 border-red-200'
                                        : 'bg-white border-pw-border'}
                            `}
                        >
                            {/* Difficulty Tag */}
                            <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-pw-surface border border-pw-border text-gray-500">
                                {q.difficulty || 'Medium'}
                            </div>

                            <div className="flex gap-4">
                                <div className={`
                                    w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold border
                                    ${isCorrect ? 'border-green-500 text-green-600 bg-green-100' :
                                        isWrong ? 'border-red-500 text-red-600 bg-red-100' :
                                            'border-gray-300 text-gray-500 bg-gray-100'}
                                `}>
                                    {isCorrect ? <FaCheck size={12} /> : isWrong ? <FaTimes size={12} /> : <FaMinusCircle size={12} />}
                                </div>
                                <div className="flex-1">
                                    <span className="text-[10px] font-mono text-gray-400 block mb-1">Question {q.index + 1}</span>
                                    <h3 className="text-base font-semibold text-pw-violet leading-snug mb-4 pr-12">
                                        {q.question}
                                    </h3>

                                    <div className="flex flex-col gap-2 mt-4">
                                        {q.options.map((option, optIdx) => {
                                            const isSelected = q.userAnswer === optIdx;
                                            const isCorrectOption = q.correctAnswer === optIdx;

                                            // Determine styling
                                            let styles = "bg-pw-surface border-pw-border text-gray-600 hover:bg-gray-50";
                                            let icon = null;

                                            if (isCorrectOption) {
                                                styles = "bg-green-50 border-green-300 text-green-800 font-bold shadow-sm";
                                                icon = <FaCheckCircle className="text-green-500 text-lg" />;
                                            } else if (isSelected) {
                                                // If selected but not correct
                                                styles = "bg-red-50 border-red-300 text-red-800 line-through decoration-red-400/50";
                                                icon = <FaTimesCircle className="text-red-500 text-lg" />;
                                            }

                                            return (
                                                <div
                                                    key={optIdx}
                                                    className={`
                                                        relative p-3 rounded-xl border text-sm flex justify-between items-center transition-all
                                                        ${styles}
                                                    `}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className={`
                                                            w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold
                                                            ${isCorrectOption ? 'bg-green-500 text-white' :
                                                                isSelected ? 'bg-red-500 text-white' :
                                                                    'bg-gray-200 text-gray-500'}
                                                        `}>
                                                            {String.fromCharCode(65 + optIdx)}
                                                        </span>
                                                        <span>{option}</span>
                                                    </div>
                                                    {icon}
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* AI Explain Button - Only for wrong answers */}
                                    {isWrong && q.userAnswer !== null && (
                                        <button
                                            onClick={() => handleAIExplain(q, q.userAnswer as number)}
                                            className="mt-4 w-full py-3 px-4 bg-gradient-to-r from-pw-violet/5 to-pw-indigo/5 hover:from-pw-violet/10 hover:to-pw-indigo/10 border border-pw-indigo/20 rounded-xl flex items-center justify-center gap-2 text-pw-indigo font-bold text-sm transition-all group"
                                        >
                                            <FaRobot className="text-pw-indigo group-hover:scale-110 transition-transform" />
                                            <span>AI se Samjho</span>
                                            <span className="text-[10px] bg-pw-indigo text-white px-2 py-0.5 rounded-full shadow-sm">FREE</span>
                                        </button>
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
