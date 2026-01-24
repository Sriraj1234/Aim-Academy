'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { LiveQuiz, Question, LiveQuizResult } from '@/data/types';
import { ModernTimer } from '@/components/quiz/ModernTimer';
import { ModernOptionButton } from '@/components/quiz/ModernOptionButton';
import { Button } from '@/components/shared/Button';
import { FaClock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { LiveLeaderboard } from '@/components/quiz/LiveLeaderboard';

export default function LiveQuizPlayerPage() {
    const { quizId } = useParams();
    const router = useRouter();
    const { user, userProfile } = useAuth();

    const [quiz, setQuiz] = useState<LiveQuiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'loading' | 'waiting' | 'active' | 'completed' | 'error'>('loading');

    // Quiz State
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [timeLeft, setTimeLeft] = useState(0);

    // Back Button Protection State
    const [backPressCount, setBackPressCount] = useState(0);

    useEffect(() => {
        // Prevent accidental back navigation
        if (status === 'active') {
            history.pushState(null, '', location.href);
            const handlePopState = () => {
                if (backPressCount === 0) {
                    history.pushState(null, '', location.href);
                    setBackPressCount(1);
                    // Use a toast or simple alert in a real app, strict alert for now
                    alert("⚠️ Warning: If you go back again, you will exit the quiz and lose your progress!");

                    // Reset count after 3 seconds so they have to double tap quickly-ish
                    setTimeout(() => setBackPressCount(0), 3000);
                } else {
                    // Allow exit, redirect to home
                    router.push('/home');
                }
            };
            window.addEventListener('popstate', handlePopState);
            return () => window.removeEventListener('popstate', handlePopState);
        }
    }, [status, backPressCount, router]);

    useEffect(() => {
        if (!quizId) return;

        const fetchQuiz = async () => {
            try {
                const docRef = doc(db, 'live_quizzes', quizId as string);
                const snap = await getDoc(docRef);

                if (snap.exists()) {
                    const data = { id: snap.id, ...snap.data() } as LiveQuiz;
                    if (!data.questions) data.questions = [];

                    setQuiz(data);

                    if (data.questions.length === 0) {
                        setStatus('error');
                        return;
                    }

                    // Check for existing submission
                    if (user) {
                        const submissionQuery = query(
                            collection(db, 'live_quiz_results'),
                            where('quizId', '==', quizId),
                            where('userId', '==', user.uid)
                        );
                        const submissionSnap = await getDocs(submissionQuery);
                        if (!submissionSnap.empty) {
                            setStatus('completed');
                            return;
                        }
                    }

                    const now = Date.now();
                    if (now < data.startTime) {
                        setStatus('waiting');
                    } else if (now > data.endTime) {
                        setStatus('completed');
                    } else {
                        // Check previous submission here if needed

                        setStatus('active');
                        // STRICT TIMER LOGIC
                        const maxDurationMs = data.duration * 60 * 1000;
                        const timeUntilClose = data.endTime - now;

                        // The User's allowed End Time is the sooner of (Now + Duration) OR (Quiz Global End Time)
                        // Actually, to display countdown properly, we just need the remaining seconds
                        const allowedSeconds = Math.min(maxDurationMs, timeUntilClose) / 1000;
                        setTimeLeft(allowedSeconds);
                    }
                } else {
                    setStatus('error');
                }
            } catch (e) {
                console.error(e);
                setStatus('error');
            } finally {
                setLoading(false);
            }
        };

        fetchQuiz();
    }, [quizId, user]);

    // Robust Timer: Decrement based on previous state is okay for short items, 
    // but better to sync with a target time if we want extreme precision. 
    // Given the constraints, the existing interval approach is acceptable if we re-sync or check edge cases.
    // Let's stick to the simple interval for UI smootness but enforce the "0" check strongly.
    useEffect(() => {
        if (status !== 'active') return;

        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [status, timeLeft]);


    const handleOptionSelect = (qId: string | undefined, optIndex: number, fallbackIndex: number) => {
        const key = qId || `q-${fallbackIndex}`;
        console.log("Option selected:", key, optIndex); // Debugging
        setAnswers(prev => ({ ...prev, [key]: optIndex }));
    };

    const handleSubmit = async () => {
        if (!quiz || !user || status === 'completed') return;

        // Prevent double submission
        setStatus('completed');

        // Calculate Score (Internal logic, not shown to user yet)
        let score = 0;
        let correctCount = 0;
        const resultAnswers = quiz.questions.map(q => {
            const selected = answers[q.id];
            const isCorrect = selected === q.correctAnswer;
            if (isCorrect) {
                score += (q.marks || 1);
                correctCount++;
            }
            return { questionId: q.id, selectedOption: selected ?? null, isCorrect };
        });

        const resultData: Omit<LiveQuizResult, 'id'> = {
            quizId: quiz.id,
            userId: user.uid,
            userName: userProfile?.displayName || 'Student',
            userPhoto: userProfile?.photoURL,
            score,
            accuracy: (correctCount / quiz.questions.length) * 100,
            timeTaken: (quiz.duration * 60) - timeLeft,
            submittedAt: Date.now(),
            answers: resultAnswers
        };

        try {
            await addDoc(collection(db, 'live_quiz_results'), resultData);

            // Celebration!
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });

            // DO NOT redirect immediately. Show success screen.
        } catch (e) {
            console.error("Submit error", e);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-pw-indigo">Loading...</div>;

    if (status === 'waiting') {
        // ... existing waiting view ...
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-pw-surface">
                <FaClock className="text-6xl text-pw-indigo mb-4 animate-bounce" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{quiz?.title}</h1>
                <p className="text-gray-500 font-medium">Starts at {new Date(quiz!.startTime).toLocaleString()}</p>
                <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-pw-border max-w-md">
                    <p className="text-sm text-gray-600">The quiz is not live yet. You will be able to join when the timer hits zero.</p>
                </div>
            </div>
        );
    }

    if (status === 'completed') {
        // NEW SUCCESS SCREEN
        const resultTime = new Date(quiz!.endTime + (10 * 60 * 1000)); // End Time + 10 mins

        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
                >
                    <FaCheckCircle className="text-5xl text-green-600" />
                </motion.div>

                <h1 className="text-3xl font-black text-gray-900 mb-2">Quiz Submitted!</h1>
                <p className="text-gray-500 font-medium max-w-md mb-8">
                    Your responses have been recorded successfully.
                </p>

                <div className="bg-pw-surface p-6 rounded-2xl border border-pw-border max-w-sm w-full space-y-4 mb-8">
                    <div className="flex items-start gap-3 text-left">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mt-1">
                            <FaClock />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800">Results Pending</p>
                            <p className="text-sm text-gray-500">
                                Results will be calculated and declared at <span className="text-pw-indigo font-bold">{resultTime.toLocaleTimeString()}</span> (10 mins after quiz ends).
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 text-left">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg mt-1">
                            <FaExclamationTriangle />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800">24-Hour Access</p>
                            <p className="text-sm text-gray-500">
                                You can view your rank and score for up to 24 hours after declaration.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 w-full max-w-sm">
                    <Button
                        onClick={() => router.push(`/play/result?mode=live&quizId=${quiz!.id}`)}
                        className="bg-pw-indigo hover:bg-pw-violet text-white px-8 py-3 rounded-xl shadow-lg border-none"
                    >
                        VIEW GLOBAL LEADERBOARD
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/home')}
                        className="text-pw-indigo hover:bg-pw-indigo/5 border border-pw-indigo/20 px-8 py-3 rounded-xl"
                    >
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 text-center bg-pw-surface">
                <h1 className="text-xl font-bold text-red-500">Error Loading Quiz</h1>
                <Button onClick={() => router.push('/home')} className="mt-4">Go Back</Button>
            </div>
        );
    }

    const currentQ = quiz?.questions?.[currentQIndex];

    if (!currentQ && status === 'active') {
        return <div className="min-h-screen flex items-center justify-center">Error: Question not found.</div>
    }

    return (
        <div className="min-h-screen bg-pw-surface pb-20 font-sans">
            {/* Header */}
            <div className="bg-white border-b border-pw-border p-4 sticky top-0 z-30 shadow-sm flex justify-between items-center">
                <div className="text-left">
                    <h1 className="font-bold text-pw-violet text-sm md:text-lg truncate max-w-[200px]">{quiz?.title}</h1>
                    <p className="text-xs text-pw-indigo font-bold bg-pw-indigo/5 px-2 py-0.5 rounded-lg inline-block">
                        Q{currentQIndex + 1} / {quiz?.questions.length}
                    </p>
                </div>
                <div className="w-24 md:w-32">
                    <ModernTimer duration={quiz!.duration * 60} current={timeLeft} />
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 h-1.5">
                <motion.div
                    className="h-full bg-pw-indigo"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQIndex + 1) / quiz!.questions.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            <div className="max-w-2xl mx-auto p-4 md:p-8 pt-6">

                {/* Live Leaderboard Teaser */}
                <div className="mb-6 flex justify-center">
                    <LiveLeaderboard />
                </div>

                <AnimatePresence mode="wait">
                    {currentQ && (
                        <motion.div
                            key={currentQIndex}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white p-6 rounded-[2rem] shadow-pw-lg border border-pw-border mb-6"
                        >
                            <div className="flex justify-between mb-4">
                                <span className="text-[10px] font-bold uppercase bg-gray-100 text-gray-500 px-2 py-1 rounded-lg tracking-wider">{currentQ.subject}</span>
                                <span className="text-[10px] font-bold uppercase bg-green-50 text-green-600 px-2 py-1 rounded-lg tracking-wider">+{currentQ.marks || 1} Marks</span>
                            </div>
                            <h2 className="text-lg md:text-xl font-bold text-gray-800 leading-relaxed mb-6">{currentQ.question}</h2>

                            <div className="space-y-3">
                                {currentQ.options.map((opt, idx) => (
                                    <ModernOptionButton
                                        key={idx}
                                        label={String.fromCharCode(65 + idx)}
                                        optionText={opt}
                                        selected={answers[currentQ.id || `q-${currentQIndex}`] === idx}
                                        onClick={() => handleOptionSelect(currentQ.id, idx, currentQIndex)}
                                        disabled={false}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex justify-between items-center gap-4 mt-8">
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQIndex === 0}
                    >
                        Previous
                    </Button>

                    {currentQIndex < (quiz?.questions.length || 0) - 1 ? (
                        <Button
                            onClick={() => setCurrentQIndex(prev => prev + 1)}
                            className="bg-pw-indigo hover:bg-pw-violet text-white px-8"
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            className="bg-green-600 hover:bg-green-700 text-white px-8 shadow-lg shadow-green-200"
                        >
                            Submit Quiz
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
