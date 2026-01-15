'use client'

import { Header } from '@/components/shared/Header'
import { ModernModeGrid } from '@/components/home/ModernModeGrid'
import { ModernCarousel } from '@/components/home/ModernCarousel'
import { AIChatWidget } from '@/components/shared/AIChatWidget'
import { Footer } from '@/components/shared/Footer'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'

// Components with user/auth data - disable SSR to prevent hydration mismatches
const DashboardHeader = dynamic(() => import('@/components/home/DashboardHeader').then(m => m.DashboardHeader), { ssr: false })
const StatsOverview = dynamic(() => import('@/components/home/StatsOverview').then(m => m.StatsOverview), { ssr: false, loading: () => <div className="h-20 bg-gray-100 rounded-xl animate-pulse" /> })
const LiveQuizBanner = dynamic(() => import('@/components/home/LiveQuizBanner').then(m => m.LiveQuizBanner), { ssr: false })
const GamificationCard = dynamic(() => import('@/components/home/GamificationCard').then(m => m.GamificationCard), { ssr: false })
const ExamCountdown = dynamic(() => import('@/components/home/ExamCountdown').then(m => m.ExamCountdown), { loading: () => <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />, ssr: false })

// Lazy Load Heavy/Below-Fold Components
const OfflineTuitionCard = dynamic(() => import('@/components/home/OfflineTuitionCard').then(m => m.OfflineTuitionCard), { loading: () => <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" /> })
const BookmarkedQuestionsSection = dynamic(() => import('@/components/home/BookmarkedQuestionsSection').then(m => m.BookmarkedQuestionsSection), { ssr: false })
const NotesSection = dynamic(() => import('@/components/home/NotesSection').then(m => m.NotesSection), { loading: () => <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />, ssr: false })
const AIPerformanceCard = dynamic(() => import('@/components/home/AIPerformanceCard').then(m => m.AIPerformanceCard), { ssr: false })
const DailyChallengeCard = dynamic(() => import('@/components/home/DailyChallengeCard').then(m => m.DailyChallengeCard), { ssr: false })
const AIQuestionGenerator = dynamic(() => import('@/components/home/AIQuestionGenerator').then(m => m.AIQuestionGenerator), { loading: () => <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" /> })
const AIFlashcardGenerator = dynamic(() => import('@/components/home/AIFlashcardGenerator').then(m => m.AIFlashcardGenerator))
const ChapterSummary = dynamic(() => import('@/components/home/ChapterSummary').then(m => m.ChapterSummary))
const TrialReminderModal = dynamic(() => import('@/components/subscription/TrialReminderModal').then(m => m.TrialReminderModal), { ssr: false })
const DiscussionSection = dynamic(() => import('@/components/home/DiscussionSection').then(m => m.DiscussionSection), { ssr: false })



import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation' // Add router
import { useEffect } from 'react' // Add useEffect
import { InteractiveLoading } from '@/components/shared/InteractiveLoading' // Add loader

export default function DashboardPage() {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    if (loading || !user) return <InteractiveLoading message="Loading Dashboard..." fullScreen />

    return (
        <div className="min-h-screen bg-pw-surface pb-20 font-sans selection:bg-pw-indigo selection:text-white">
            <Header />

            <main className="pt-20 pb-16 md:pt-24 md:pb-20 space-y-3 md:space-y-5">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.1 }}
                    className="px-4 max-w-7xl mx-auto"
                >
                    <DashboardHeader />
                </motion.div>

                {/* Hero Carousel - Edge to Edge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <ModernCarousel />
                </motion.div>

                <div className="px-4 max-w-7xl mx-auto space-y-4 md:space-y-6 w-full overflow-x-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                        {/* Left Column */}
                        <div className="lg:col-span-2 space-y-4 md:space-y-6">

                            {/* Exam Countdown Widget */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                <ExamCountdown />
                            </motion.div>

                            {/* Stats Overview */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white rounded-2xl p-3 md:p-5 border border-pw-border shadow-pw-md"
                            >
                                <h3 className="text-lg font-bold text-pw-violet mb-3 md:mb-4 flex items-center gap-2">
                                    <span className="text-xl">📊</span> Overview
                                </h3>
                                <StatsOverview />
                            </motion.div>

                            <LiveQuizBanner />

                            <GamificationCard />
                            <AIPerformanceCard />

                            {/* Study Modes */}
                            <div id="study-modes" className="space-y-4 pt-4"> {/* Added wrapper for scroll target */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="shadow-sm rounded-xl p-1"
                                >
                                    <h3 className="text-xl font-bold text-pw-violet pl-3 border-l-4 border-pw-indigo mb-4">
                                        Study Modes
                                    </h3>
                                    <ModernModeGrid />
                                </motion.div>
                            </div>


                        </div>

                        {/* Right Column: AI Tools & Extras */}
                        <div className="space-y-6">
                            <DiscussionSection />

                            <div className="hidden lg:block">
                                <OfflineTuitionCard />
                            </div>

                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white rounded-2xl p-5 border border-pw-border shadow-pw-md"
                            >
                                <h3 className="text-lg font-bold text-pw-violet mb-4 flex items-center gap-2">
                                    <span className="text-xl">🤖</span> AI Study Tools
                                </h3>
                                <div className="space-y-3">
                                    <AIQuestionGenerator />
                                    <AIFlashcardGenerator />
                                    <ChapterSummary />
                                </div>
                            </motion.div>

                            {/* Moved Sections for Compact View */}
                            <BookmarkedQuestionsSection />
                            <NotesSection />
                        </div>

                        {/* Mobile Only: Offline Tuition at Bottom */}
                        <div className="px-4 max-w-7xl mx-auto block lg:hidden pb-6">
                            <OfflineTuitionCard />
                        </div>

                    </div>
                </div>
            </main>

            <DailyChallengeCard />



            <AIChatWidget />
            <TrialReminderModal />

            <Footer />
        </div>
    )
}
