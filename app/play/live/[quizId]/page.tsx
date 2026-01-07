'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { LiveQuiz, Question, LiveQuizResult } from '@/data/types';
import { ModernTimer } from '@/components/quiz/ModernTimer';
import { ModernOptionButton } from '@/components/quiz/ModernOptionButton';
import { Button } from '@/components/shared/Button';
import { FaClock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

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

    useEffect(() => {
        if (!quizId) return;

        const fetchQuiz = async () => {
            try {
                const docRef = doc(db, 'live_quizzes', quizId as string);
                const snap = await getDoc(docRef);

                if (snap.exists()) {
                    const data = { id: snap.id, ...snap.data() } as LiveQuiz;

                    // Safeguard: Ensure questions exists
                    if (!data.questions) {
                        data.questions = [];
                    }

                    setQuiz(data);

                    if (data.questions.length === 0) {
                        setStatus('error'); // Cannot play a quiz with no questions
                        return;
                    }

                    const now = Date.now();
                    if (now < data.startTime) {
                        setStatus('waiting');
                    } else if (now > data.endTime) {
                        setStatus('completed'); // Or 'missed'
                    } else {
                        // Check if user already submitted? (Optional: Implement check here)
                        setStatus('active');
                        // Calculate remaining time relative to end time OR fixed duration
                        // For a live quiz, usually everyone ends at same time OR user has X mins from start
                        // Let's assume strict window: End Time - Now
                        // OR if user starts late, they get min(duration, endTime - now)

                        const maxDurationMs = data.duration * 60 * 1000;
                        const timeUntilClose = data.endTime - now;

                        // We give them proper duration, but capped at window close
                        setTimeLeft(Math.min(maxDurationMs, timeUntilClose) / 1000);
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
    }, [quizId]);

    // Timer Logic
    useEffect(() => {
        if (status !== 'active' || timeLeft <= 0) return;

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


    const handleOptionSelect = (qId: string, optIndex: number) => {
        setAnswers(prev => ({ ...prev, [qId]: optIndex }));
    };

    const handleSubmit = async () => {
        if (!quiz || !user) return;
        setStatus('completed');

        // Calculate Score
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

        // Save Result
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
            // Redirect to result page (could comprise specific live result page)
            setTimeout(() => router.push('/play/result'), 2000); // For now redirect to standard result or custom
        } catch (e) {
            console.error("Submit error", e);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-pw-indigo">Loading...</div>;

    if (status === 'waiting') {
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

    if (status === 'completed' || status === 'error') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-pw-surface">
                <FaCheckCircle className="text-6xl text-green-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Quiz Ended</h1>
                <p className="text-gray-500">Redirecting to results...</p>
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

            <div className="max-w-2xl mx-auto p-4 md:p-8 pt-6">
                {currentQ && (
                    <div className="bg-white p-6 rounded-[2rem] shadow-pw-lg border border-pw-border mb-6">
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
                                    selected={answers[currentQ.id] === idx}
                                    onClick={() => handleOptionSelect(currentQ.id, idx)}
                                    disabled={false}
                                />
                            ))}
                        </div>
                    </div>
                )}

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
