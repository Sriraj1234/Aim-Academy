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
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    const todayStr = new Date().toISOString().split('T')[0];
    const STORAGE_KEY = `daily_challenge_q_${todayStr}`;

    // Random subject picker
    const getRandomSubject = () => {
        const subjects = ['Mathematics', 'Science', 'Social Science', 'English'];
        return subjects[Math.floor(Math.random() * subjects.length)];
    };

    useEffect(() => {
        const initChallenge = async () => {
            if (!user) return;

            try {
                // 1. Check Firestore if already completed today
                const challengeRef = doc(db, 'users', user.uid, 'daily_challenges', todayStr);
                const docSnap = await getDoc(challengeRef);

                if (docSnap.exists() && docSnap.data().correct) {
                    setIsVisible(false); // Already done, hide completely
                    setLoading(false);
                    return;
                }

                setIsVisible(true); // Not done, show widget

                // 2. Check LocalStorage for existing question (to keep it consistent for the day)
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
        if (selectedOption !== null || !question) return;

        setSelectedOption(index);
        const correct = index === question.correctAnswer;
        setIsCorrect(correct);

        if (correct) {
            // Reward & Save
            await addXP(30); // Requested: 30 XP

            if (user) {
                await setDoc(doc(db, 'users', user.uid, 'daily_challenges', todayStr), {
                    questionId: question.id || 'ai-gen',
                    correct: true,
                    timestamp: Date.now(),
                    xpEarned: 30
                });
            }

            // Auto-close after delay
            setTimeout(() => {
                setIsVisible(false); // Disappear
            }, 3000);
        } else {
            // Incorrect logic: Allow retry or generate new? User said "if i correct answer then i will get 30 xp". 
            // Usually we allow retry or fail. I'll just show incorrect state.
            // If strictly "daily challenge", maybe fail for the day? 
            // "popup hat jaye" only on correct. So it stays if wrong.
            // I'll reset selection after 2s to allow retry.
            setTimeout(() => {
                setSelectedOption(null);
                setIsCorrect(null);
            }, 2000);
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
                        className="bg-white pointer-events-auto rounded-2xl shadow-2xl border border-pw-border w-80 mb-4 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <FaFire className="animate-pulse" />
                                <span className="font-bold">Daily Challenge</span>
                            </div>
                            <button onClick={() => setIsExpanded(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                                <FaChevronUp className="rotate-180" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            {loading ? (
                                <div className="py-8 text-center text-gray-400 text-sm animate-pulse">
                                    <FaRobot className="mx-auto text-2xl mb-2 text-pw-indigo" />
                                    Creating your challenge...
                                </div>
                            ) : question ? (
                                <>
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="bg-orange-50 p-2 rounded-lg">
                                            <FaGift className="text-orange-500 text-xl" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{question.subject}</p>
                                            <p className="text-sm font-medium text-gray-800 line-clamp-3">{question.question}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {question.options.map((opt: string, idx: number) => {
                                            const isSelected = selectedOption === idx;
                                            const isRight = idx === question.correctAnswer;

                                            let style = "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100";
                                            // Provide feedback immediately on selection
                                            if (isSelected) {
                                                style = isRight
                                                    ? "bg-green-100 border-green-500 text-green-700 shadow-sm"
                                                    : "bg-red-100 border-red-500 text-red-700 shadow-sm";
                                            }

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleOptionSelect(idx)}
                                                    disabled={selectedOption !== null}
                                                    className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all flex justify-between items-center ${style}`}
                                                >
                                                    <span>{opt}</span>
                                                    {isSelected && (isRight ? <FaCheckCircle /> : <FaTimesCircle />)}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {isCorrect === true && (
                                        <motion.div
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className="mt-4 text-center text-green-600 text-sm font-bold bg-green-50 p-2 rounded-lg border border-green-100"
                                        >
                                            +30 XP Earned! 🎉
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
