'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/shared/Button'
import { ModernOptionButton } from '@/components/quiz/ModernOptionButton'
import { LiveLeaderboard } from '@/components/quiz/LiveLeaderboard'
import { ModernTimer } from '@/components/quiz/ModernTimer'
import { InteractiveLoading } from '@/components/shared/InteractiveLoading'
import { useQuiz } from '@/hooks/useQuiz'
import { useTimer } from '@/hooks/useTimer'
import { useAuth } from '@/hooks/useAuth'
import { useSound } from '@/hooks/useSound'
import { FaChevronLeft, FaPause, FaPlay, FaInfoCircle, FaBookmark, FaRegBookmark, FaStepForward, FaStepBackward, FaStar, FaFire, FaTrophy } from 'react-icons/fa'
import { HiSparkles } from 'react-icons/hi'

export default function QuizPage() {
    const router = useRouter()
    const { user } = useAuth(); // Need user for specific storage key
    const [isAILoading, setIsAILoading] = useState(true); // Default true to prevent flash/redirect
    const { questions, currentQuestionIndex, submitAnswer, nextQuestion, prevQuestion, skipQuestion, toggleBookmark, bookmarks, isFinished, isLoading, isSavingResult, answers, startAIQuiz } = useQuiz()
    const [selectedOption, setSelectedOption] = useState<number | null>(null)
    const [isLocked, setIsLocked] = useState(false)
    const { play } = useSound() // Sound effects hook

    // Appreciation System States
    const [correctStreak, setCorrectStreak] = useState(0)
    const [showCelebration, setShowCelebration] = useState<{ type: string; message: string } | null>(null)

    // Double-Tap Back Logic
    const [showExitWarning, setShowExitWarning] = useState(false);

    useEffect(() => {
        window.history.pushState(null, '', window.location.href);

        const handlePopState = () => {
            const isWarningVisible = document.getElementById('exit-warning');
            if (isWarningVisible) {
                router.push('/');
            } else {
                window.history.pushState(null, '', window.location.href);
                setShowExitWarning(true);
                setTimeout(() => setShowExitWarning(false), 2000);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [router]);

    // Handle AI Mode Loading
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const mode = searchParams.get('mode');

        if (mode === 'ai') {
            if (!user) return; // Wait for auth

            setIsAILoading(true);
            const stored = localStorage.getItem(`ai_quiz_questions_${user.uid}`);

            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        startAIQuiz(parsed);
                        setIsAILoading(false);
                        return;
                    }
                } catch (e) {
                    console.error("Failed to load AI questions", e);
                }
            }

            // If we reached here, something failed
            console.warn("No AI questions found for user");
            router.push('/');
        } else {
            setIsAILoading(false); // Not AI mode
        }
    }, [user, questions.length]) // Re-run when user loads

    // Sync state when question changes
    useEffect(() => {
        if (!questions[currentQuestionIndex]) return; // Guard clause
        const recordedAnswer = answers[currentQuestionIndex]
        if (recordedAnswer !== undefined && recordedAnswer !== null) {
            setSelectedOption(recordedAnswer)
            setIsLocked(true)
        } else {
            setSelectedOption(null)
            setIsLocked(false)
        }
    }, [currentQuestionIndex, answers, questions])

    // Initialize timer: 30 seconds per question
    const totalTime = questions.length > 0 ? questions.length * 30 : 60;

    const { timeLeft, isRunning, pauseTimer, resumeTimer } = useTimer(totalTime, () => {
        // Time up logic - Force submit or end
        router.push('/play/result')
    })

    // Redirect if no questions
    useEffect(() => {
        if (!isLoading && !isAILoading && questions.length === 0) {
            router.push('/')
        }
    }, [questions, router, isLoading, isAILoading])

    useEffect(() => {
        if (isFinished) {
            router.push('/play/result')
        }
    }, [isFinished, router])

    if (isLoading || isAILoading || isSavingResult) {
        return (
            <InteractiveLoading
                message={isSavingResult ? "Saving your progress..." : "Preparing your challenge..."}
            />
        )
    }

    const question = questions[currentQuestionIndex]

    // Robust Guard: Check for question AND valid options array to prevent crashes
    if (!question || !Array.isArray(question.options)) {
        return (
            <div className="min-h-screen bg-pw-surface flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-3xl shadow-pw-lg border border-pw-border">
                    <FaInfoCircle className="text-4xl text-pw-indigo mx-auto mb-4" />
                    <h3 className="font-bold text-lg text-gray-700">Question Unavailable</h3>
                    <p className="text-gray-500 mb-6">This question seems to be invalid or missing options.</p>
                    <Button onClick={() => skipQuestion()}>Skip to Next</Button>
                </div>
            </div>
        )
    }

    // Safety fallback for optional fields
    const safeOptions = question.options.map(o => o || "Option Missing");

    const handleOptionClick = (index: number) => {
        if (!isLocked) {
            setSelectedOption(index)
            play('click') // Click sound on option select
        }
    }

    const handleLockAnswer = () => {
        if (!isRunning) resumeTimer()
        setIsLocked(true)
        submitAnswer(selectedOption)

        // Check correct/wrong and play sound
        const isCorrect = selectedOption === question?.correctAnswer
        play(isCorrect ? 'correct' : 'wrong')

        // Streak & Appreciation Logic
        if (isCorrect) {
            const newStreak = correctStreak + 1
            setCorrectStreak(newStreak)

            // Milestone celebrations
            if (newStreak === 3) {
                setShowCelebration({ type: 'fire', message: '3x Streak! 🔥 Keep going!' })
                play('success')
            } else if (newStreak === 5) {
                setShowCelebration({ type: 'star', message: '5x Streak! ⭐ Superstar!' })
                play('levelUp')
            } else if (newStreak === 10) {
                setShowCelebration({ type: 'trophy', message: '10x PERFECT! 🏆 CHAMPION!' })
                play('levelUp')
            } else if (newStreak > 0 && newStreak % 10 === 0) {
                setShowCelebration({ type: 'trophy', message: `${newStreak}x STREAK! 🎯 UNSTOPPABLE!` })
                play('levelUp')
            }

            // Auto-hide celebration
            if (newStreak >= 3) {
                setTimeout(() => setShowCelebration(null), 2000)
            }
        } else {
            setCorrectStreak(0) // Reset streak on wrong answer
        }

        // Navigate faster on the last question
        const isLastQuestion = currentQuestionIndex === questions.length - 1
        const delay = isLastQuestion ? 500 : 800

        setTimeout(() => {
            nextQuestion()
            // State sync effect will handle reset
        }, delay)
    }



    return (
        <div className="min-h-screen bg-pw-surface pb-32 font-sans selection:bg-pw-indigo selection:text-white">
            {/* Ambient Background Glow - Royal PW Theme */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pw-indigo/10 rounded-full blur-[100px]" />
                <div className="absolute bottom[-10%] right-[-10%] w-[40%] h-[40%] bg-pw-violet/10 rounded-full blur-[100px]" />
            </div>

            {/* Celebration Overlay */}
            <AnimatePresence>
                {showCelebration && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
                    >
                        {/* Confetti particles */}
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{
                                    x: 0, y: 0, opacity: 1, scale: 1,
                                }}
                                animate={{
                                    x: (Math.random() - 0.5) * 400,
                                    y: (Math.random() - 0.5) * 400,
                                    opacity: 0,
                                    scale: 0,
                                    rotate: Math.random() * 360
                                }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="absolute"
                                style={{
                                    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#F97316'][i % 5]
                                }}
                            >
                                <HiSparkles className="text-2xl" />
                            </motion.div>
                        ))}

                        {/* Main celebration badge */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                            transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                            className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-1 rounded-3xl shadow-2xl"
                        >
                            <div className="bg-white dark:bg-gray-900 rounded-[1.3rem] px-8 py-6 text-center">
                                <motion.div
                                    animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
                                    transition={{ duration: 0.5, repeat: 2 }}
                                    className="text-5xl mb-3"
                                >
                                    {showCelebration.type === 'fire' && <FaFire className="text-orange-500 mx-auto" />}
                                    {showCelebration.type === 'star' && <FaStar className="text-yellow-500 mx-auto" />}
                                    {showCelebration.type === 'trophy' && <FaTrophy className="text-yellow-500 mx-auto" />}
                                </motion.div>
                                <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                                    {showCelebration.message}
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header - PW Style */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-pw-border shadow-pw-sm font-sans transition-all">
                <div className="max-w-5xl mx-auto px-3 h-16 flex items-center justify-between relative gap-2">
                    {/* LEFT: Back & Subject */}
                    <div className="flex items-center gap-2 relative z-10 shrink-1 min-w-0">
                        <button
                            onClick={() => router.back()}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors shrink-0 active:scale-95"
                        >
                            <FaChevronLeft className="text-sm" />
                        </button>
                        <div className="flex flex-col text-left min-w-0 max-w-[100px] sm:max-w-xs">
                            <h1 className="font-bold text-sm text-pw-violet leading-tight capitalize truncate">
                                {question.subject}
                            </h1>
                            <p className="text-[10px] text-pw-indigo font-medium uppercase tracking-wider truncate">
                                {question.mainSubject || question.subSubject || 'General'}
                            </p>
                        </div>
                    </div>

                    {/* CENTER: Timer (Fixed Width to prevent layout shifts) */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="scale-75 sm:scale-100 origin-center pointer-events-auto">
                            <ModernTimer duration={totalTime} current={timeLeft} />
                        </div>
                    </div>

                    {/* RIGHT: Controls */}
                    <div className="flex items-center gap-1.5 relative z-10 shrink-0">
                        <button
                            onClick={() => toggleBookmark(question.id)}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors active:scale-95 ${bookmarks.includes(question.id) ? 'bg-pw-red/10 text-pw-red' : 'bg-gray-50 text-gray-400 hover:text-pw-indigo'}`}
                        >
                            {bookmarks.includes(question.id) ? <FaBookmark size={14} /> : <FaRegBookmark size={14} />}
                        </button>

                        <button
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200 active:scale-95"
                            onClick={isRunning ? pauseTimer : resumeTimer}
                        >
                            {isRunning ? <FaPause className="text-[10px]" /> : <FaPlay className="text-[10px]" />}
                        </button>
                    </div>
                </div>

                {/* Slim Gradient Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-pw-surface">
                    <motion.div
                        className="h-full bg-gradient-to-r from-pw-indigo to-pw-lavender"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                </div>
            </header>

            <main className="pt-20 px-3 md:px-4 max-w-3xl mx-auto relative z-10 pb-44 md:pb-32">
                {/* Stats Row */}
                <div className="flex items-center justify-between mb-4 md:mb-6 px-1">
                    <span className="text-[10px] font-bold text-pw-indigo uppercase tracking-widest bg-white border border-pw-indigo/10 px-3 py-1.5 rounded-full shadow-sm">
                        Question {currentQuestionIndex + 1} <span className="text-gray-400">/ {questions.length}</span>
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="px-2 py-1 rounded-md bg-green-50 text-green-700 text-[10px] font-bold border border-green-200 shadow-sm">
                            +1.0
                        </div>
                        <div className="px-2 py-1 rounded-md bg-red-50 text-red-700 text-[10px] font-bold border border-red-200 shadow-sm">
                            -0.25
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[1.5rem] p-5 md:p-8 shadow-sm border border-pw-border mb-8 relative overflow-hidden">
                    {/* Decorative Top Accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pw-indigo via-pw-violet to-pw-indigo opacity-50" />

                    {/* Question Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={currentQuestionIndex + '-text'}
                        className="mb-8 text-left"
                    >
                        <h2 className="text-lg md:text-2xl font-display font-medium text-gray-800 leading-relaxed mb-4 text-left">
                            {question.question}
                        </h2>

                        {/* Question Meta Tags - simplified */}
                        {/* <div className="flex flex-wrap gap-2 mb-2">
                            <span className="px-2 py-1 bg-gray-50 border border-gray-100 text-gray-500 text-[10px] font-semibold rounded uppercase tracking-wider">
                                {question.chapter}
                            </span>
                        </div> */}
                    </motion.div>

                    {/* Options Grid */}
                    <div className="grid gap-3">
                        <AnimatePresence mode="wait">
                            {safeOptions.map((option, index) => {
                                let correctState: boolean | null = null;
                                if (isLocked) {
                                    if (index === question.correctAnswer) {
                                        correctState = true;
                                    } else if (selectedOption === index) {
                                        correctState = false;
                                    }
                                }

                                return (
                                    <motion.div
                                        key={`${currentQuestionIndex}-${index}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <ModernOptionButton
                                            label={String.fromCharCode(65 + index)}
                                            optionText={option}
                                            selected={selectedOption === index}
                                            correct={correctState}
                                            onClick={() => handleOptionClick(index)}
                                            disabled={isLocked}
                                        />
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                </div>



                {/* Floating Bottom Bar - Optimized for Mobile */}
                <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none pb-6">
                    <div className="max-w-3xl mx-auto pointer-events-auto">
                        <div className="bg-white p-3 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-pw-border flex items-center justify-between gap-3">

                            {/* Previous Button - Smaller on mobile */}
                            <Button
                                variant="ghost"
                                onClick={prevQuestion}
                                disabled={currentQuestionIndex === 0}
                                className="w-12 h-12 md:w-auto md:px-6 rounded-2xl shrink-0 flex items-center justify-center hover:bg-gray-100 text-gray-500"
                                title="Previous"
                            >
                                <FaStepBackward />
                                <span className="hidden md:inline ml-2">Prev</span>
                            </Button>

                            {/* Lock Answer (Center) - Calls for action */}
                            <div className="flex-grow">
                                <Button
                                    fullWidth
                                    size="xl"
                                    disabled={selectedOption === null && !isLocked}
                                    onClick={handleLockAnswer}
                                    className={`
                                        rounded-2xl text-base shadow-md transition-all h-12 font-bold uppercase tracking-wide
                                        ${isLocked
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-gray-200'
                                            : 'bg-[#110c1d] hover:bg-black text-white shadow-purple-200'
                                        }
                                    `}
                                >
                                    {isLocked ? 'Next' : 'Lock Answer'}
                                </Button>
                            </div>

                            {/* Skip Button - Smaller on mobile */}
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setIsLocked(false)
                                    setSelectedOption(null)
                                    skipQuestion()
                                }}
                                className="w-12 h-12 md:w-auto md:px-6 rounded-2xl shrink-0 flex items-center justify-center text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-100"
                                title="Skip"
                            >
                                <span className="hidden md:inline mr-2">Skip</span>
                                <FaStepForward />
                            </Button>
                        </div>
                    </div>
                </div>
            </main >

            {/* Exit Warning Toast */}
            <AnimatePresence>
                {showExitWarning && (
                    <div id="exit-warning" className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-black/80 text-white px-6 py-3 rounded-full shadow-2xl backdrop-blur-md font-bold text-sm tracking-wide border border-white/20 whitespace-nowrap"
                        >
                            Press Back again to exit quiz 🚪
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    )
}
