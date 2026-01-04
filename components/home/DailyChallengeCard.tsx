'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFire, FaTimes, FaRobot, FaCheckCircle, FaTimesCircle, FaGift, FaChevronUp } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Question } from '@/data/types';

export const DailyChallengeCard = () => {
    const { user, userProfile, addXP } = useAuth();
    const [isVisible, setIsVisible] = useState(false); // Controls if the main widget is shown (hidden if completed)
    const [isExpanded, setIsExpanded] = useState(false); // Controls maximized/minimized state
    const [loading, setLoading] = useState(true);
    const [question, setQuestion] = useState<any | null>(null);

    // NEW STATE LOGIC: Single-attempt strict mode
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    const todayStr = new Date().toISOString().split('T')[0];
    const STORAGE_KEY = `daily_challenge_q_${todayStr}`;

    // Random subject picker
    const getRandomSubject = () => {
        const subjects = ['Mathematics', 'Science', 'English', 'Economics']; // Replaced Social Science with Economics
        return subjects[Math.floor(Math.random() * subjects.length)];
    };

    useEffect(() => {
        const initChallenge = async () => {
            if (!user) return;

            try {
                // 1. Check Firestore if already completed today
                const challengeRef = doc(db, 'users', user.uid, 'daily_challenges', todayStr);
                const docSnap = await getDoc(challengeRef);

                if (docSnap.exists()) {
                    // Already attempted today (win or loss)
                    setIsVisible(false);
                    setLoading(false);
                    return;
                }

                setIsVisible(true); // Not done, show widget

                // 2. Check LocalStorage for existing question
                const cached = localStorage.getItem(STORAGE_KEY);
                if (cached) {
                    setQuestion(JSON.parse(cached));
                    setLoading(false);
                } else {
                    // 3. Generate new AI Question
                    await generateNewQuestion();
                }

            } catch (error) {
                console.error("Daily challenge init error:", error);
                setLoading(false);
            }
        };

        const generateNewQuestion = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/ai/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subject: getRandomSubject(),
                        count: 1,
                        difficulty: 'medium',
                        board: userProfile?.board || 'CBSE',
                        classLevel: userProfile?.class ? `Class ${userProfile.class}` : 'Class 10'
                    })
                });
                const data = await res.json();
                if (data.success && data.questions?.length > 0) {
                    const q = data.questions[0];
                    setQuestion(q);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(q));
                }
            } catch (err) {
                console.error("Failed to generate:", err);
            } finally {
                setLoading(false);
            }
        };

        initChallenge();
    }, [user, userProfile, todayStr]);

    const handleOptionSelect = async (index: number) => {
        if (selectedOption !== null || !question) return; // Prevent multi-clicks

        setSelectedOption(index);
        const correct = index === question.correctAnswer;
        setIsCorrect(correct);

        if (user) {
            // Save attempt immediately (win or loss)
            await setDoc(doc(db, 'users', user.uid, 'daily_challenges', todayStr), {
                questionId: question.id || 'ai-gen',
                correct: correct,
                timestamp: Date.now(),
                xpEarned: correct ? 30 : 0
            });
        }

        if (correct) {
            // Reward
            await addXP(30);

            // Auto-close success
            setTimeout(() => {
                setIsVisible(false);
            }, 4000);
        } else {
            // Wrong: Just show feedback, user failed.
            // Optional: Auto-close fail? Or let them close?
            // User said "disable ho jayiga". 
            // We'll leave it visible so they see they failed.
            setTimeout(() => {
                setIsVisible(false);
            }, 3000);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end pointer-events-none">
            {/* Main Popup Card */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="bg-white dark:bg-slate-900 pointer-events-auto rounded-2xl shadow-2xl border border-pw-border dark:border-slate-700 w-80 md:w-96 mb-4 overflow-hidden flex flex-col max-h-[80vh]"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2">
                                <FaFire className="animate-pulse" />
                                <span className="font-bold">Daily Challenge</span>
                            </div>
                            <button onClick={() => setIsExpanded(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                                <FaChevronUp className="rotate-180" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="py-8 text-center text-gray-400 text-sm animate-pulse">
                                    <FaRobot className="mx-auto text-2xl mb-2 text-pw-indigo" />
                                    Creating your challenge...
                                </div>
                            ) : question ? (
                                <>
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg shrink-0">
                                            <FaGift className="text-orange-500 text-xl" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">{question.subject}</p>
                                            {/* REMOVED line-clamp-3 to show full question */}
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{question.question}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {question.options.map((opt: string, idx: number) => {
                                            const isSelected = selectedOption === idx;
                                            const isRightAnswer = idx === question.correctAnswer;
                                            const showResult = selectedOption !== null;

                                            // Default style
                                            let style = "bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-750";

                                            // Result Styles
                                            if (showResult) {
                                                if (isSelected) {
                                                    style = isCorrect
                                                        ? "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-600 dark:text-green-400 font-bold"
                                                        : "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-600 dark:text-red-400 opacity-80";
                                                } else if (isRightAnswer && !isCorrect) {
                                                    // Show correct answer if user got it wrong
                                                    style = "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-600 dark:text-green-400 font-bold ring-2 ring-green-100 dark:ring-green-900";
                                                } else {
                                                    style += " opacity-50 cursor-not-allowed";
                                                }
                                            }

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleOptionSelect(idx)}
                                                    disabled={showResult}
                                                    className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all flex justify-between items-center ${style}`}
                                                >
                                                    <span className="flex-1 mr-2">{opt}</span>

                                                    {showResult && isSelected && !isCorrect && (
                                                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-red-600 dark:text-red-400">
                                                            Wrong <FaTimesCircle className="text-sm" />
                                                        </span>
                                                    )}
                                                    {showResult && isRightAnswer && (
                                                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-green-600 dark:text-green-400">
                                                            Correct <FaCheckCircle className="text-sm" />
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {isCorrect === true && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                            className="mt-4 text-center text-green-600 dark:text-green-400 text-sm font-bold bg-green-50 dark:bg-green-900/20 p-2 rounded-lg border border-green-100 dark:border-green-900/30"
                                        >
                                            +30 XP Earned! 🎉
                                        </motion.div>
                                    )}

                                    {isCorrect === false && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                            className="mt-4 text-center text-red-500 dark:text-red-400 text-sm font-bold bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-900/30"
                                        >
                                            Wrong Answer! Better luck next time. 😔
                                        </motion.div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center text-red-400 text-sm py-4">
                                    Failed to load challenge.
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button (Always visible if challenge active) */}
            {!isExpanded && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsExpanded(true)}
                    className="pointer-events-auto w-14 h-14 bg-gradient-to-r from-orange-500 to-red-600 rounded-full shadow-lg shadow-orange-500/40 flex items-center justify-center text-white relative group"
                >
                    <FaFire className="text-2xl animate-pulse" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-red-600 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                        1
                    </span>
                    <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Daily Challenge
                    </span>
                </motion.button>
            )}
        </div>
    );
};
