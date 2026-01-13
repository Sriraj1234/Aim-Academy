'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FaRobot, FaTimes, FaPlay, FaSpinner, FaCheck, FaBolt, FaUserGraduate, FaLanguage } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

interface GeneratedQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty: string;
    subject: string;
    chapter: string;
}

interface AIQuestionGeneratorProps {
    onStartQuiz?: (questions: GeneratedQuestion[]) => void;
}

const SUBJECTS = [
    'Physics', 'Chemistry', 'Biology',
    'History', 'Geography', 'Economics', 'Political Science'
];

const DIFFICULTIES = [
    { id: 'easy', label: 'Easy', color: 'green' },
    { id: 'medium', label: 'Medium', color: 'yellow' },
    { id: 'hard', label: 'Hard', color: 'red' }
];

export const AIQuestionGenerator: React.FC<AIQuestionGeneratorProps> = ({ onStartQuiz }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { user: contextUser, userProfile } = useAuth();

    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [language, setLanguage] = useState<'english' | 'hindi' | 'hinglish'>('hinglish');
    const [count, setCount] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const generateQuestions = async () => {
        if (!contextUser) {
            setError('Please login to use AI features');
            return;
        }
        if (!subject) {
            setError('Please select a subject');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject,
                    topic: topic || undefined,
                    difficulty,
                    count,
                    language,
                    board: userProfile?.board || 'CBSE',
                    classLevel: userProfile?.class ? `Class ${userProfile.class}` : 'Class 10'
                })
            });

            const data = await response.json();

            if (data.success && data.questions) {
                setIsOpen(false);
                if (onStartQuiz) {
                    onStartQuiz(data.questions);
                } else {
                    localStorage.setItem('generated_quiz', JSON.stringify(data.questions));
                    router.push('/play/quiz?mode=ai-generated');
                }
            } else {
                setError(data.error || 'Failed to generate questions');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Trigger Card */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(true)}
                className="w-full h-full relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-[1px] rounded-2xl shadow-xl shadow-emerald-500/20"
            >
                <div className="bg-[#0f0a1f]/90 backdrop-blur-xl h-full p-6 rounded-2xl flex flex-col justify-between group">
                    <div className="flex justify-between items-start">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <FaRobot className="text-white text-xl" />
                        </div>
                        <FaBolt className="text-emerald-400/50" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">AI Quiz Generator</h4>
                        <p className="text-xs text-white/50 mt-1">Practice unlimited questions</p>
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
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#0f0a1f] w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FaRobot className="text-emerald-400" />
                                    <span>AI Quiz Setup</span>
                                </h3>
                                <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white">
                                    <FaTimes />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8 space-y-6">
                                {/* Subject Selection */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Select Subject</label>
                                    <div className="flex flex-wrap gap-2">
                                        {SUBJECTS.map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setSubject(s)}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${subject === s
                                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 scale-105'
                                                    : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Topic Input */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Specific Topic (Optional)</label>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g. Periodic Table, Algebra..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                                    />
                                </div>

                                {/* Difficulty & Language */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Difficulty</label>
                                        <div className="flex bg-white/5 p-1 rounded-xl">
                                            {DIFFICULTIES.map((d) => (
                                                <button
                                                    key={d.id}
                                                    onClick={() => setDifficulty(d.id as any)}
                                                    className={`flex-1 py-1.5 capitalize text-xs font-bold rounded-lg transition-all ${difficulty === d.id ? 'bg-emerald-500 text-white shadow' : 'text-white/40 hover:text-white'}`}
                                                >
                                                    {d.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Question Count</label>
                                        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/5">
                                            <input
                                                type="range"
                                                min="5"
                                                max="20"
                                                step="5"
                                                value={count}
                                                onChange={(e) => setCount(parseInt(e.target.value))}
                                                className="w-full accent-emerald-500"
                                            />
                                            <span className="font-bold text-white w-8">{count}</span>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-bold">
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={generateQuestions}
                                    disabled={loading || !subject}
                                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale transition-all hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95 text-lg"
                                >
                                    {loading ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            <span>Building Quiz...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaPlay />
                                            <span>Start Challenge</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
