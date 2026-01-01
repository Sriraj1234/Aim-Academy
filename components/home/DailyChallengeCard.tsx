'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFire, FaClock, FaCheckCircle, FaTimesCircle, FaTrophy, FaGift } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { Question } from '@/data/types';
import { mockQuestions } from '@/data/mock';

export const DailyChallengeCard = () => {
    const { user, addXP } = useAuth();
    const [status, setStatus] = useState<'loading' | 'active' | 'completed'>('loading');
    const [question, setQuestion] = useState<Question | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
    const [showQuestion, setShowQuestion] = useState(false);

    // Generate a deterministic daily question based on date
    const getDailyQuestion = () => {
        const today = new Date();
        // Simple seed: Day + Month + Year
        const seed = today.getDate() + today.getMonth() + today.getFullYear();
        // Use seed to pick from mockQuestions
        const index = seed % mockQuestions.length;
        return mockQuestions[index];
    }

    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    useEffect(() => {
        const checkDailyStatus = async () => {
            if (!user) return;

            try {
                // Check if user already did today's challenge
                const challengeRef = doc(db, 'users', user.uid, 'daily_challenges', todayStr);
                const docSnap = await getDoc(challengeRef);

                if (docSnap.exists()) {
                    setStatus('completed');
                    setResult(docSnap.data().correct ? 'correct' : 'incorrect');
                } else {
                    setStatus('active');
                    setQuestion(getDailyQuestion());
                }
            } catch (error) {
                console.error("Error checking daily status:", error);
                setStatus('active'); // Fallback to let them play
                setQuestion(getDailyQuestion());
            }
        };

        checkDailyStatus();
    }, [user, todayStr]);

    const handleOptionSelect = async (index: number) => {
        if (selectedOption !== null || !question || !user) return; // Already selected

        setSelectedOption(index);
        const isCorrect = index === question.correctAnswer;
        setResult(isCorrect ? 'correct' : 'incorrect');

        // Save result
        try {
            const challengeRef = doc(db, 'users', user.uid, 'daily_challenges', todayStr);
            await setDoc(challengeRef, {
                questionId: question.id,
                correct: isCorrect,
                timestamp: Date.now(),
                xpEarned: isCorrect ? 50 : 0
            });

            if (isCorrect) {
                await addXP(50);
            }

            // Wait a bit then show summary
            setTimeout(() => {
                setStatus('completed');
                setShowQuestion(false);
            }, 2000);

        } catch (error) {
            console.error("Error saving daily challenge:", error);
        }
    };

    if (status === 'loading') return null; // Or skeleton

    return (
        <motion.div
            layout
            className="relative overflow-hidden bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-4 md:p-6 text-white shadow-xl border border-white/10"
        >
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between mb-4 gap-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm shadow-inner border border-white/20 shrink-0">
                            <FaFire className="text-yellow-400 text-lg md:text-xl animate-pulse" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base md:text-lg leading-tight text-white drop-shadow-sm">Daily Challenge</h3>
                            <p className="text-[10px] md:text-xs text-indigo-200 font-medium tracking-wide">Win 50 XP Reward!</p>
                        </div>
                    </div>
                    {status === 'active' && !showQuestion && (
                        <div className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold border border-white/20 flex items-center gap-1.5">
                            <FaClock className="text-yellow-300" /> Expires at midnight
                        </div>
                    )}
                </div>

                <AnimatePresence mode='wait'>
                    {status === 'completed' ? (
                        <motion.div
                            key="completed"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/10"
                        >
                            {result === 'correct' ? (
                                <>
                                    <div className="text-5xl mb-2 animate-bounce">🏆</div>
                                    <h4 className="text-xl font-bold text-yellow-300 mb-1">Challenge Crushed!</h4>
                                    <p className="text-indigo-100 text-sm mb-4">+50 XP Added to your profile.</p>
                                    <div className="inline-block px-4 py-2 bg-green-500/20 text-green-300 rounded-lg text-sm font-bold border border-green-500/30">
                                        Come back tomorrow for a new quest
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-5xl mb-2 grayscale opacity-80">💔</div>
                                    <h4 className="text-xl font-bold text-red-300 mb-1">Better Luck Next Time</h4>
                                    <p className="text-indigo-100 text-sm mb-4">Keep practicing to improve your accuracy.</p>
                                    <div className="inline-block px-4 py-2 bg-white/10 text-gray-300 rounded-lg text-sm font-bold border border-white/10">
                                        New challenge arrives tomorrow
                                    </div>
                                </>
                            )}
                        </motion.div>
                    ) : showQuestion && question ? (
                        <motion.div
                            key="question"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white text-gray-800 rounded-xl p-5 shadow-lg"
                        >
                            <h4 className="font-bold text-lg mb-4">{question.question}</h4>
                            <div className="grid gap-2">
                                {question.options.map((opt, idx) => {
                                    const isSelected = selectedOption === idx;
                                    const isCorrect = idx === question.correctAnswer;

                                    let btnClass = "bg-gray-50 border-gray-200 hover:bg-gray-100";
                                    if (selectedOption !== null) {
                                        if (isSelected && isCorrect) btnClass = "bg-green-100 border-green-500 text-green-800 font-bold";
                                        else if (isSelected && !isCorrect) btnClass = "bg-red-100 border-red-500 text-red-800 font-bold";
                                        else if (isCorrect) btnClass = "bg-green-50 border-green-300 text-green-700"; // Reveal correct
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleOptionSelect(idx)}
                                            disabled={selectedOption !== null}
                                            className={`p-3 rounded-lg border text-left text-sm transition-all ${btnClass}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>{opt}</span>
                                                {selectedOption !== null && isCorrect && <FaCheckCircle className="text-green-600" />}
                                                {selectedOption !== null && isSelected && !isCorrect && <FaTimesCircle className="text-red-600" />}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="start"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
                                <p className="text-sm text-indigo-100 italic opacity-80 mb-2">"Consistency is the key to mastery."</p>
                                <div className="flex items-center gap-2 text-xs font-bold text-yellow-300">
                                    <FaGift /> Mystery Reward Inside
                                </div>
                            </div>
                            <button
                                onClick={() => setShowQuestion(true)}
                                className="w-full py-3 bg-white text-indigo-900 rounded-xl font-bold shadow-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <FaFire className="text-orange-500" /> Accept Challenge
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
