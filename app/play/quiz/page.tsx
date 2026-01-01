'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/shared/Button'
import { ModernOptionButton } from '@/components/quiz/ModernOptionButton'
import { LiveLeaderboard } from '@/components/quiz/LiveLeaderboard'
import { ModernTimer } from '@/components/quiz/ModernTimer'
import { useQuiz } from '@/hooks/useQuiz'
import { useTimer } from '@/hooks/useTimer'
import { useAuth } from '@/hooks/useAuth'
import { FaChevronLeft, FaPause, FaPlay, FaInfoCircle, FaBookmark, FaRegBookmark, FaStepForward, FaStepBackward } from 'react-icons/fa'

export default function QuizPage() {
    const router = useRouter()
    const { user } = useAuth(); // Need user for specific storage key
    const [isAILoading, setIsAILoading] = useState(true); // Default true to prevent flash/redirect
    const { questions, currentQuestionIndex, submitAnswer, nextQuestion, prevQuestion, skipQuestion, toggleBookmark, bookmarks, isFinished, isLoading, isSavingResult, answers, startAIQuiz } = useQuiz()
    const [selectedOption, setSelectedOption] = useState<number | null>(null)
    const [isLocked, setIsLocked] = useState(false)

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
            <div className="min-h-screen bg-pw-surface flex items-center justify-center flex-col gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pw-indigo"></div>
                {isSavingResult && <p className="text-pw-violet font-bold animate-pulse">Saving your progress...</p>}
            </div>
        )
    }

    const question = questions[currentQuestionIndex]

    if (!question) return null

    const handleOptionClick = (index: number) => {
        if (!isLocked) {
            setSelectedOption(index)
        }
    }

    const handleLockAnswer = () => {
        if (!isRunning) resumeTimer()
        setIsLocked(true)
        submitAnswer(selectedOption)

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

            {/* Header - PW Style */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-pw-border shadow-pw-sm">
                <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between relative">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl hover:bg-pw-surface text-gray-500 transition-colors"
                        >
                            <FaChevronLeft className="text-sm md:text-base" />
                        </button>
                        <div>
                            <h1 className="font-bold text-lg text-pw-violet leading-tight capitalize">
                                {question.subject}
                            </h1>
                            <p className="text-xs text-pw-indigo font-medium uppercase tracking-wider">
                                {question.subSubject || 'General'}
                            </p>
                        </div>
                    </div>

                    {/* Centered Timer - Visible on all screens now with responsive width */}
                    <div className="absolute left-1/2 -translate-x-1/2 w-40 md:w-48">
                        <ModernTimer duration={totalTime} current={timeLeft} className="w-full" />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="md:hidden">
                            {/* Mobile Timer Icon only? Or small pill? For now let's just keep the buttons */}
                        </div>
                        <button
                            onClick={() => toggleBookmark(question.id)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${bookmarks.includes(question.id) ? 'bg-pw-red/10 text-pw-red' : 'bg-pw-surface text-gray-400 hover:text-pw-indigo'}`}
                        >
                            {bookmarks.includes(question.id) ? <FaBookmark /> : <FaRegBookmark />}
                        </button>

                        <button
                            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-pw-surface text-gray-600 hover:bg-pw-border transition-colors border border-pw-border"
                            onClick={isRunning ? pauseTimer : resumeTimer}
                        >
                            {isRunning ? <FaPause className="text-xs md:text-sm" /> : <FaPlay className="text-xs md:text-sm" />}
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

            <main className="pt-24 px-4 max-w-3xl mx-auto relative z-10 pb-32">
                {/* Stats Row */}
                <div className="flex items-center justify-between mb-8 px-2">
                    <span className="text-sm font-bold text-pw-indigo uppercase tracking-widest bg-pw-indigo/5 px-3 py-1 rounded-lg">
                        Question {currentQuestionIndex + 1} <span className="text-gray-400">/ {questions.length}</span>
                    </span>
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-bold border border-green-200 shadow-sm">
                            +{question.marks}.0
                        </div>
                        <div className="px-3 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-bold border border-red-200 shadow-sm">
                            -0.25
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-pw-lg border border-pw-border mb-32 relative overflow-hidden">
                    {/* Decorative Top Accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pw-indigo via-pw-violet to-pw-indigo opacity-50" />

                    {/* Question Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={currentQuestionIndex + '-text'}
                        className="mb-8"
                    >
                        <h2 className="text-xl md:text-2xl font-display font-bold text-pw-violet leading-relaxed mb-6">
                            {question.question}
                        </h2>

                        {/* Question Meta Tags */}
                        <div className="flex flex-wrap gap-2 mb-2">
                            <span className="px-3 py-1 bg-pw-surface border border-pw-border text-pw-indigo text-xs font-bold rounded-lg uppercase tracking-wider shadow-sm">
                                {question.difficulty}
                            </span>
                            <span className="px-3 py-1 bg-pw-surface border border-pw-border text-pw-indigo text-xs font-bold rounded-lg uppercase tracking-wider shadow-sm">
                                {question.chapter}
                            </span>
                        </div>
                    </motion.div>

                    {/* Options Grid */}
                    <div className="grid gap-3">
                        <AnimatePresence mode="wait">
                            {question.options.map((option, index) => {
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



                {/* Floating Bottom Bar */}
                <div className="fixed bottom-4 left-4 right-4 z-40 max-w-3xl mx-auto">
                    <div className="bg-white/90 backdrop-blur-md p-2 md:p-4 rounded-[1.5rem] shadow-pw-xl border border-pw-border flex items-center justify-between gap-2 md:gap-4">

                        {/* Previous Button */}
                        <Button
                            variant="ghost"
                            onClick={prevQuestion}
                            disabled={currentQuestionIndex === 0}
                            className="w-12 h-12 md:w-auto md:px-6 rounded-full shrink-0 flex items-center justify-center hover:bg-pw-surface"
                        >
                            <FaStepBackward />
                            <span className="hidden md:inline ml-2">Prev</span>
                        </Button>

                        {/* Lock Answer (Center) */}
                        <div className="flex-grow">
                            <Button
                                fullWidth
                                size="xl"
                                disabled={selectedOption === null && !isLocked}
                                onClick={handleLockAnswer}
                                className={`
                                    rounded-xl text-lg shadow-lg transition-all h-12 font-bold
                                    ${isLocked
                                        ? 'bg-pw-surface text-gray-400 cursor-not-allowed shadow-none border border-pw-border'
                                        : 'bg-pw-indigo hover:bg-pw-violet text-white shadow-pw-indigo/30'
                                    }
                                `}
                            >
                                {isLocked ? 'Next Question...' : 'Lock Answer'}
                            </Button>
                        </div>

                        {/* Skip Button */}
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setIsLocked(false)
                                setSelectedOption(null)
                                skipQuestion()
                            }}
                            className="w-12 h-12 md:w-auto md:px-6 rounded-full md:rounded-2xl shrink-0 flex items-center justify-center text-gray-500 hover:text-gray-700"
                        >
                            <span className="hidden md:inline mr-2">Skip</span>
                            <FaStepForward />
                        </Button>
                    </div>
                </div>
            </main >
        </div >
    )
}

