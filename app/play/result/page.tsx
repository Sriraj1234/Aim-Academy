'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ScoreCircle } from '@/components/result/ScoreCircle'
import { ReviewList } from '@/components/result/ReviewList'
import { Button } from '@/components/shared/Button'
import { Confetti } from '@/components/animations/Confetti'
import { FaHome, FaChartBar, FaUser, FaGamepad, FaBullseye, FaCheckCircle, FaClock, FaArrowLeft, FaMinusCircle, FaSpinner, FaWhatsapp } from 'react-icons/fa'
import { useQuiz } from '@/hooks/useQuiz'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore'
import { Question, LiveQuizResult } from '@/data/types'
import { Leaderboard } from '@/components/result/Leaderboard'

const ResultContent = () => {
    const { questions: ctxQuestions, answers: ctxAnswers, calculateScore: ctxCalculateScore, startTime, endTime } = useQuiz()
    const { user, userProfile } = useAuth()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [showReview, setShowReview] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)

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

    const [quizData, setQuizData] = useState<{
        questions: Question[]
        answers: (number | null)[]
        score: number
        timeString: string
        xpEarned: number
    } | null>(null)

    // Live Quiz Logic
    const searchParams = useSearchParams()
    const mode = searchParams.get('mode')
    const liveQuizId = searchParams.get('quizId')

    const [leaderboardData, setLeaderboardData] = useState<any[]>([])
    const [currentUserEntry, setCurrentUserEntry] = useState<any>(null)

    useEffect(() => {
        const loadResult = async () => {
            if (mode === 'live' && liveQuizId) {
                try {
                    // Fetch all results for this quiz
                    const q = query(
                        collection(db, 'live_quiz_results'),
                        where('quizId', '==', liveQuizId)
                    )
                    const snapshot = await getDocs(q)
                    const results: LiveQuizResult[] = snapshot.docs.map(d => d.data() as LiveQuizResult)

                    // Sort: Score (Desc) -> Accuracy (Desc) -> Time (Asc)
                    results.sort((a, b) => {
                        if (b.score !== a.score) return b.score - a.score
                        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy
                        return a.timeTaken - b.timeTaken
                    })

                    // Assign Ranks
                    const rankedData = results.map((r, i) => ({
                        userId: r.userId,
                        userName: r.userName,
                        userPhoto: r.userPhoto,
                        score: r.score,
                        accuracy: r.accuracy,
                        timeTaken: r.timeTaken,
                        rank: i + 1,
                        isCurrentUser: user?.uid === r.userId,
                        badge: (user?.uid === r.userId) ?
                            (userProfile?.subscription?.plan === 'pro' && userProfile?.subscription?.status === 'active' ? 'pro' :
                                (userProfile?.gamification?.currentStreak || 0) >= 30 ? 'streak' : null)
                            : null
                    }))

                    setLeaderboardData(rankedData)

                    const myEntry = rankedData.find(r => r.userId === user?.uid)
                    if (myEntry) {
                        setCurrentUserEntry(myEntry)
                        // Also set main quiz data for the standard view if needed, 
                        // but for live we primarily want the leaderboard.
                        // We can construct a partial quizData to show the standard score card too.
                        setQuizData({
                            questions: [], // We might not have questions here unless we fetch the quiz too
                            answers: [],
                            score: myEntry.score,
                            timeString: `${Math.floor(myEntry.timeTaken / 60)}m ${Math.floor(myEntry.timeTaken % 60)}s`,
                            xpEarned: 0 // Live quizzes might handle XP differently
                        })
                    }

                } catch (error) {
                    console.error("Failed to load live results", error)
                }
                setLoading(false)
                return
            }

            // 1. Try Context First (Fastest)
            if (ctxQuestions.length > 0) {
                const durationMs = endTime - startTime;
                const durationSec = Math.floor(durationMs / 1000);
                const minutes = Math.floor(durationSec / 60);
                const seconds = durationSec % 60;

                // Calculate XP correctly: 2 XP per correct answer
                let correctCount = 0;
                ctxQuestions.forEach((q, i) => {
                    if (ctxAnswers[i] === q.correctAnswer) correctCount++;
                });

                setQuizData({
                    questions: ctxQuestions,
                    answers: ctxAnswers,
                    score: ctxCalculateScore(),
                    timeString: `${minutes}m ${seconds}s`,
                    xpEarned: correctCount * 2
                })
                setLoading(false)
                return
            }

            // 2. Fallback to Firestore (Persistence)
            if (user) {
                try {
                    const q = query(
                        collection(db, 'users', user.uid, 'quiz_results'),
                        orderBy('date', 'desc'),
                        limit(1)
                    )
                    const snapshot = await getDocs(q)

                    if (!snapshot.empty) {
                        const data = snapshot.docs[0].data()

                        // Calculate time if duration exists
                        let timeStr = 'Completed';
                        if (data.duration) {
                            const durationSec = Math.floor(data.duration / 1000);
                            const minutes = Math.floor(durationSec / 60);
                            const seconds = durationSec % 60;
                            timeStr = `${minutes}m ${seconds}s`;
                        }

                        // Legacy support: if questions missing, we can't show much
                        if (data.questions) {
                            // Calculate XP if missing (legacy)
                            let xp = data.xpEarned;
                            if (xp === undefined) {
                                let correctCount = 0;
                                (data.questions as Question[]).forEach((q: Question, i: number) => {
                                    if (data.answers[i] === q.correctAnswer) correctCount++;
                                });
                                xp = correctCount * 2;
                            }

                            setQuizData({
                                questions: data.questions,
                                answers: data.answers,
                                score: data.score,
                                timeString: timeStr,
                                xpEarned: xp
                            })
                        }
                    }
                } catch (error) {
                    console.error("Failed to recover result", error)
                }
            }
            setLoading(false)
        }

        loadResult()
    }, [ctxQuestions, user, userProfile, ctxAnswers, mode, liveQuizId])

    // Effect for confetti
    useEffect(() => {
        if (quizData) {
            const percentage = (quizData.score / quizData.questions.length) * 100
            if (percentage >= 80) setShowConfetti(true)
        }
    }, [quizData])

    // Loading State
    if (loading) {
        return (
            <div className="min-h-screen bg-pw-surface flex flex-col items-center justify-center space-y-4">
                <FaSpinner className="animate-spin text-4xl text-pw-indigo" />
                <p className="text-pw-violet/70 text-sm animate-pulse font-medium">Retrieving your result...</p>
            </div>
        )
    }

    // Live Mode - Show leaderboard even if user hasn't participated
    if (mode === 'live' && leaderboardData.length > 0) {
        return (
            <div className="min-h-screen bg-pw-surface text-pw-violet pb-32 overflow-x-hidden font-sans">
                {/* Background Ambience */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-pw-lavender/20 blur-[120px] rounded-full mix-blend-multiply" />
                    <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100/40 blur-[100px] rounded-full mix-blend-multiply" />
                </div>

                <main className="relative pt-8 px-4 max-w-2xl mx-auto z-10">
                    {/* User's Score Card (if participated) */}
                    {currentUserEntry && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl p-6 border border-pw-border shadow-pw-lg mb-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Your Rank</p>
                                    <p className="text-4xl font-black text-pw-indigo">#{currentUserEntry.rank}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-pw-violet">{currentUserEntry.score} pts</p>
                                    <p className="text-sm text-gray-500">{Math.round(currentUserEntry.accuracy)}% accuracy</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Leaderboard */}
                    <Leaderboard entries={leaderboardData} currentUserEntry={currentUserEntry} />

                    {/* Bottom Actions */}
                    <div className="mt-8 flex flex-col gap-3">
                        <Link href="/home" className="w-full">
                            <Button fullWidth className="h-14 bg-pw-indigo hover:bg-pw-violet text-white shadow-lg text-sm font-bold tracking-wide rounded-xl border-none">
                                <FaHome className="mr-2" />
                                BACK TO HOME
                            </Button>
                        </Link>
                    </div>
                </main>
            </div>
        )
    }

    // No Data State (for non-live mode)
    if (!quizData) {
        return (
            <div className="min-h-screen bg-pw-surface flex flex-col items-center justify-center text-center px-6">
                <div className="w-20 h-20 bg-white rounded-full shadow-pw-md flex items-center justify-center mb-6 border border-pw-border">
                    <FaChartBar className="text-3xl text-pw-indigo/30" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-pw-violet">No Result Found</h2>
                <p className="text-gray-500 mb-8 max-w-xs">We couldn't find your last quiz result. Try taking a new quiz.</p>
                <Link href="/play/selection">
                    <Button className="font-bold px-8 bg-pw-indigo hover:bg-pw-violet text-white shadow-lg">START NEW QUIZ</Button>
                </Link>
            </div>
        )
    }

    const { questions, answers, score, timeString, xpEarned } = quizData
    const totalQuestions = questions.length
    const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0
    const skippedCount = answers.filter(a => a === null || a === undefined).length
    const isHighScore = accuracy >= 80
    const isPass = accuracy >= 40

    return (
        <div className="min-h-screen bg-pw-surface text-pw-violet pb-32 overflow-x-hidden font-sans">
            {/* Confetti Celebration */}
            <Confetti active={showConfetti} duration={4000} particleCount={80} />

            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-pw-lavender/20 blur-[120px] rounded-full mix-blend-multiply" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100/40 blur-[100px] rounded-full mix-blend-multiply" />
            </div>

            {/* Review Mode Overlay */}
            <AnimatePresence>
                {showReview && (
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[100] bg-pw-surface overflow-y-auto"
                    >
                        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-pw-border p-4 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setShowReview(false)}
                                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-50 transition-colors border border-pw-border shadow-sm text-pw-indigo"
                                >
                                    <FaArrowLeft />
                                </button>
                                <div>
                                    <h2 className="font-bold text-lg leading-tight text-pw-violet">Review Answers</h2>
                                    <p className="text-xs text-gray-500">Detailed breakdown</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-pw-indigo">{score}/{totalQuestions}</div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-wider">Score</div>
                            </div>
                        </div>
                        <div className="p-4 max-w-2xl mx-auto pb-20">
                            <ReviewList questions={questions} answers={answers} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="relative pt-8 px-6 max-w-lg mx-auto flex flex-col items-center z-10">
                {/* Result Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="w-full relative"
                >
                    {/* Floating Badge */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white shadow-pw-lg border border-pw-border px-4 py-1.5 rounded-full flex items-center gap-2 z-20">
                        {isHighScore ? (
                            <>
                                <FaGamepad className="text-pw-indigo text-xs" />
                                <span className="text-xs font-bold text-pw-violet tracking-wide uppercase">New High Score</span>
                            </>
                        ) : (
                            <>
                                <FaCheckCircle className="text-green-500 text-xs" />
                                <span className="text-xs font-bold text-green-700 tracking-wide uppercase">Quiz Completed</span>
                            </>
                        )}
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 border border-pw-border shadow-pw-xl relative overflow-hidden">
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-pw-lavender/5 via-transparent to-transparent opacity-50" />

                        <div className="flex flex-col items-center relative z-10">
                            <div className="mb-6 relative">
                                <div className="absolute inset-0 bg-pw-indigo/5 blur-3xl rounded-full scale-150 animate-pulse" />
                                <ScoreCircle score={score} total={totalQuestions} size={160} />
                            </div>

                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-3xl font-display font-black mb-2 text-center text-pw-violet"
                            >
                                {isHighScore ? 'Outstanding!' : isPass ? 'Good Job!' : 'Keep Going!'}
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-gray-500 text-sm text-center max-w-[200px] leading-relaxed mb-8 font-medium"
                            >
                                {isHighScore
                                    ? "You've mastered this topic. Time for the next challenge?"
                                    : "You're getting there. Review your mistakes to improve."}
                            </motion.p>

                            {/* Stats Grid - Modernized */}
                            <div className="grid grid-cols-2 gap-3 w-full mb-8">
                                {/* XP Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-pw-surface rounded-2xl p-4 flex flex-col items-center justify-center border border-pw-border relative overflow-hidden group hover:shadow-pw-sm transition-all"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white text-pw-indigo flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform border border-pw-border">
                                        <FaGamepad size={18} />
                                    </div>
                                    <span className="text-xl font-black text-pw-violet">+{xpEarned} XP</span>
                                    <span className="text-[10px] text-pw-indigo/60 uppercase tracking-widest font-bold">Earned</span>
                                </motion.div>

                                {/* Accuracy Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="bg-pw-surface rounded-2xl p-4 flex flex-col items-center justify-center border border-pw-border relative overflow-hidden group hover:shadow-pw-sm transition-all"
                                >
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform border border-blue-100">
                                        <FaBullseye size={18} />
                                    </div>
                                    <span className="text-xl font-bold text-pw-violet">{accuracy}%</span>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Accuracy</span>
                                </motion.div>

                                {/* Time Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="bg-pw-surface rounded-2xl p-4 flex flex-col items-center justify-center border border-pw-border relative overflow-hidden group hover:shadow-pw-sm transition-all"
                                >
                                    <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform border border-orange-100">
                                        <FaClock size={18} />
                                    </div>
                                    <span className="text-xl font-bold whitespace-nowrap text-pw-violet">{timeString}</span>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Time</span>
                                </motion.div>

                                {/* Correct Answers Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 }}
                                    className="bg-pw-surface rounded-2xl p-4 flex flex-col items-center justify-center border border-pw-border relative overflow-hidden group hover:shadow-pw-sm transition-all"
                                >
                                    <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform border border-green-100">
                                        <FaCheckCircle size={18} />
                                    </div>
                                    <span className="text-xl font-bold text-pw-violet">{score}/{totalQuestions}</span>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Correct</span>
                                </motion.div>
                            </div>

                            {/* Actions */}
                            <div className="w-full flex flex-col gap-3">
                                <Button
                                    onClick={() => setShowReview(true)}
                                    fullWidth
                                    className="h-14 bg-pw-indigo hover:bg-pw-violet text-white shadow-lg shadow-pw-indigo/20 text-sm font-bold tracking-wide rounded-xl transform transition-transform active:scale-95 border-none"
                                >
                                    <FaChartBar className="mr-2" />
                                    ANALYZE MISTAKES
                                </Button>
                                <Link href="/play/selection" className="w-full">
                                    <Button
                                        variant="ghost"
                                        fullWidth
                                        className="h-14 text-pw-indigo hover:bg-pw-indigo/5 border-2 border-dashed border-pw-indigo/20 hover:border-pw-indigo/40 text-sm font-bold tracking-wide rounded-xl"
                                    >
                                        PRACTICE AGAIN
                                    </Button>
                                </Link>

                                {/* Share on WhatsApp */}
                                <Button
                                    onClick={() => {
                                        const shareText = `🏆 I just scored ${score}/${totalQuestions} (${accuracy}% accuracy) on Padhaku! Can you beat me? 💪`;
                                        const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

                                        // Try native share first, fallback to WhatsApp link
                                        if (navigator.share) {
                                            navigator.share({
                                                title: 'My Quiz Score',
                                                text: shareText
                                            }).catch(() => window.open(shareUrl, '_blank'));
                                        } else {
                                            window.open(shareUrl, '_blank');
                                        }
                                    }}
                                    fullWidth
                                    className="h-14 bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 text-sm font-bold tracking-wide rounded-xl transform transition-transform active:scale-95 border-none"
                                >
                                    <FaWhatsapp className="mr-2 text-lg" />
                                    SHARE ON WHATSAPP
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Live Leaderboard Section */}
                    {mode === 'live' && leaderboardData.length > 0 && (
                        <div className="mt-8 mb-20 w-full">
                            <Leaderboard entries={leaderboardData} currentUserEntry={currentUserEntry} />
                        </div>
                    )}
                </motion.div>
            </main>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-pw-border flex items-center justify-around px-6 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                <Link href="/" className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-pw-indigo transition-colors group">
                    <FaHome className="text-xl group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold tracking-wide">Home</span>
                </Link>
                <Link href="/" className="flex flex-col items-center gap-1.5 text-pw-indigo relative">
                    <div className="absolute -top-10 bg-pw-indigo rounded-full p-4 shadow-xl shadow-pw-indigo/30 border-4 border-white transform transition-transform hover:-translate-y-1">
                        <FaGamepad className="text-2xl text-white" />
                    </div>
                    <span className="text-[10px] font-bold tracking-wide mt-6">Play</span>
                </Link>
                <Link href="/profile" className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-pw-indigo transition-colors group">
                    <FaUser className="text-xl group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold tracking-wide">Profile</span>
                </Link>
            </div>

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
                            Press Back again to go home 🏠
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    )
}


const ResultPage = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-pw-surface flex flex-col items-center justify-center space-y-4">
                <FaSpinner className="animate-spin text-4xl text-pw-indigo" />
                <p className="text-pw-violet/70 text-sm animate-pulse font-medium">Loading result...</p>
            </div>
        }>
            <ResultContent />
        </Suspense>
    )
}

export default ResultPage
