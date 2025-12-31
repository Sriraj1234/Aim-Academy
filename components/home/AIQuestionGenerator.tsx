'use client';

import React, { useState } from 'react';
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
    'Physics', 'Chemistry', 'Biology', 'Mathematics',
    'History', 'Geography', 'Economics', 'Political Science'
];

const DIFFICULTIES = [
    { id: 'easy', label: 'Easy', color: 'green' },
    { id: 'medium', label: 'Medium', color: 'yellow' },
    { id: 'hard', label: 'Hard', color: 'red' }
];

export const AIQuestionGenerator: React.FC<AIQuestionGeneratorProps> = ({ onStartQuiz }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { userProfile } = useAuth();
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [language, setLanguage] = useState<'english' | 'hindi' | 'hinglish'>('hinglish');
    const [count, setCount] = useState(10);
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
    const [error, setError] = useState('');
    const router = useRouter(); // Import this

    const generateQuestions = async () => {
        if (!subject) {
            setError('Please select a subject');
            return;
        }

        setLoading(true);
        setError('');
        setQuestions([]);

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
                setQuestions(data.questions);
            } else {
                setError(data.error || 'Failed to generate questions');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartQuiz = () => {
        if (questions.length > 0) {
            // Save to localStorage
            localStorage.setItem('ai_quiz_questions', JSON.stringify(questions));
            localStorage.setItem('ai_quiz_meta', JSON.stringify({
                subject,
                topic,
                difficulty,
                count,
                language // Store language too
            }));

            if (onStartQuiz) {
                onStartQuiz(questions);
            } else {
                // Default behavior: navigate to quiz page
                router.push('/play/quiz?mode=ai');
            }
            setIsOpen(false);
        }
    };

    const resetState = () => {
        setSubject('');
        setTopic('');
        setDifficulty('medium');
        setCount(5);
        setQuestions([]);
        setError('');
    };

    return (
        <>
            {/* Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all"
            >
                <FaRobot className="text-xl" />
                <div className="text-left">
                    <p className="font-bold">AI Practice Mode</p>
                    <p className="text-xs opacity-80">Generate custom questions instantly</p>
                </div>
                <FaBolt className="ml-auto text-yellow-300" />
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
                            className="w-full max-w-md bg-gradient-to-br from-[#1a1330] to-[#0f0a1f] rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-4 border-b border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                        <FaRobot className="text-white text-lg" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm">AI Question Generator</h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <p className="text-[10px] text-white/50">Powered by Groq AI</p>
                                            {userProfile?.class && (
                                                <span className="text-[10px] bg-white/10 text-purple-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <FaUserGraduate className="text-[9px]" />
                                                    Class {userProfile.class} • {userProfile.board || 'CBSE'}
                                                </span>
                                            )}
                                        </div>
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
                            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                                {questions.length === 0 ? (
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
                                                            ? 'bg-purple-600 text-white'
                                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Topic Input */}
                                        <div>
                                            <label className="text-xs text-white/60 uppercase tracking-wider font-bold block mb-2">
                                                Topic / Chapter (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={topic}
                                                onChange={(e) => setTopic(e.target.value)}
                                                placeholder="e.g., Photosynthesis, French Revolution..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-purple-500/50"
                                            />
                                        </div>

                                        {/* Difficulty */}
                                        <div>
                                            <label className="text-xs text-white/60 uppercase tracking-wider font-bold block mb-2">
                                                Difficulty Level
                                            </label>
                                            <div className="flex gap-2">
                                                {DIFFICULTIES.map((d) => (
                                                    <button
                                                        key={d.id}
                                                        onClick={() => setDifficulty(d.id as 'easy' | 'medium' | 'hard')}
                                                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${difficulty === d.id
                                                            ? d.color === 'green' ? 'bg-green-600 text-white' :
                                                                d.color === 'yellow' ? 'bg-yellow-600 text-white' :
                                                                    'bg-red-600 text-white'
                                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {d.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Language Selection */}
                                        <div>
                                            <label className="text-xs text-white/60 uppercase tracking-wider font-bold block mb-2">
                                                Language
                                            </label>
                                            <div className="flex gap-2">
                                                {[
                                                    { id: 'english', label: 'English' },
                                                    { id: 'hindi', label: 'Hindi' }, // Hindi option added
                                                    { id: 'hinglish', label: 'Hinglish' }
                                                ].map((l) => (
                                                    <button
                                                        key={l.id}
                                                        onClick={() => setLanguage(l.id as any)}
                                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${language === l.id
                                                            ? 'bg-pink-600 text-white'
                                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {l.id === 'hindi' && <span className="text-xs">अ</span>}
                                                        {l.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Question Count */}
                                        <div>
                                            <label className="text-xs text-white/60 uppercase tracking-wider font-bold block mb-2">
                                                Number of Questions
                                            </label>
                                            <div className="flex gap-2">
                                                {[5, 10, 15, 20].map((n) => (
                                                    <button
                                                        key={n}
                                                        onClick={() => setCount(n)}
                                                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${count === n
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {n}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center text-red-400 text-sm">
                                                {error}
                                            </div>
                                        )}

                                        {/* Generate Button */}
                                        <button
                                            onClick={generateQuestions}
                                            disabled={loading || !subject}
                                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                                        >
                                            {loading ? (
                                                <>
                                                    <FaSpinner className="animate-spin" />
                                                    <span>Generating Questions...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FaRobot />
                                                    <span>Generate {count} Questions</span>
                                                </>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    /* Questions Preview */
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-green-400">
                                                <FaCheck />
                                                <span className="font-bold text-sm">{questions.length} Questions Generated!</span>
                                            </div>
                                            <button
                                                onClick={resetState}
                                                className="text-xs text-white/40 hover:text-white/60"
                                            >
                                                Generate More
                                            </button>
                                        </div>

                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {questions.map((q, i) => (
                                                <div key={q.id} className="bg-white/5 rounded-xl p-3 text-sm">
                                                    <p className="text-white/80 line-clamp-2">
                                                        <span className="text-purple-400 font-bold">Q{i + 1}. </span>
                                                        {q.question}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={handleStartQuiz}
                                            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-green-500/30 transition-all"
                                        >
                                            <FaPlay />
                                            <span>Start AI Quiz</span>
                                        </button>
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
