'use client'

import { Header } from '@/components/shared/Header'
import { ModernModeGrid } from '@/components/home/ModernModeGrid'
import { ModernCarousel } from '@/components/home/ModernCarousel'
import { AIChatWidget } from '@/components/shared/AIChatWidget'
import { Footer } from '@/components/shared/Footer'
import { QuickActionStrip } from '@/components/home/QuickActionStrip'
import dynamic from 'next/dynamic'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { InteractiveLoading } from '@/components/shared/InteractiveLoading'

// Components with user/auth data - disable SSR to prevent hydration mismatches
const DashboardHeader = dynamic(() => import('@/components/home/DashboardHeader').then(m => m.DashboardHeader), { ssr: false })
const StatsOverview = dynamic(() => import('@/components/home/StatsOverview').then(m => m.StatsOverview), { ssr: false, loading: () => <div className="h-20 bg-gray-100 rounded-xl animate-pulse" /> })
const LiveQuizBanner = dynamic(() => import('@/components/home/LiveQuizBanner').then(m => m.LiveQuizBanner), { ssr: false })
const GamificationCard = dynamic(() => import('@/components/home/GamificationCard').then(m => m.GamificationCard), { ssr: false })
const ExamCountdown = dynamic(() => import('@/components/home/ExamCountdown').then(m => m.ExamCountdown), { loading: () => <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />, ssr: false })

// Below-fold — lazy loaded
const AIPerformanceCard = dynamic(() => import('@/components/home/AIPerformanceCard').then(m => m.AIPerformanceCard), { ssr: false })
const DailyChallengeCard = dynamic(() => import('@/components/home/DailyChallengeCard').then(m => m.DailyChallengeCard), { ssr: false })
const BookmarkedQuestionsSection = dynamic(() => import('@/components/home/BookmarkedQuestionsSection').then(m => m.BookmarkedQuestionsSection), { ssr: false })
const NotesSection = dynamic(() => import('@/components/home/NotesSection').then(m => m.NotesSection), { loading: () => <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />, ssr: false })
const OfflineTuitionCard = dynamic(() => import('@/components/home/OfflineTuitionCard').then(m => m.OfflineTuitionCard), { loading: () => <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" /> })
const AIQuestionGenerator = dynamic(() => import('@/components/home/AIQuestionGenerator').then(m => m.AIQuestionGenerator), { loading: () => <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" /> })
const AIFlashcardGenerator = dynamic(() => import('@/components/home/AIFlashcardGenerator').then(m => m.AIFlashcardGenerator))
const ChapterSummary = dynamic(() => import('@/components/home/ChapterSummary').then(m => m.ChapterSummary))
const TrialReminderModal = dynamic(() => import('@/components/subscription/TrialReminderModal').then(m => m.TrialReminderModal), { ssr: false })
const DiscussionSection = dynamic(() => import('@/components/home/DiscussionSection').then(m => m.DiscussionSection), { ssr: false })

const SCROLL_CACHE_KEY = 'home_scroll_position';

export default function DashboardPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const scrollSaverRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Last Visited Section: save & restore scroll ──────────────────────────
    useEffect(() => {
        const saved = sessionStorage.getItem(SCROLL_CACHE_KEY);
        if (saved) {
            const y = parseInt(saved, 10);
            const t = setTimeout(() => window.scrollTo({ top: y, behavior: 'instant' }), 100);
            return () => clearTimeout(t);
        }
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (scrollSaverRef.current) clearTimeout(scrollSaverRef.current);
            scrollSaverRef.current = setTimeout(() => {
                sessionStorage.setItem(SCROLL_CACHE_KEY, String(window.scrollY));
            }, 300);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (scrollSaverRef.current) clearTimeout(scrollSaverRef.current);
        };
    }, []);

    if (loading) return <InteractiveLoading message="Loading Dashboard..." fullScreen />

    return (
        <div className="min-h-screen bg-pw-surface pb-20 font-sans selection:bg-pw-indigo selection:text-white">
            <Header />

            <main className="pt-20 pb-16 md:pt-24 md:pb-20">
                <div className="px-4 max-w-7xl mx-auto space-y-4 md:space-y-5 w-full overflow-x-hidden">

                    {/* ── 1. Greeting Header ─────────────────────────────────── */}
                    <DashboardHeader />

                    {/* ── 2. Quick Action Strip (most important — top always) ── */}
                    <section aria-label="Quick actions">
                        <QuickActionStrip />
                    </section>

                    {/* ── 3. Stats Bar (compact, always visible to motivate) ─── */}
                    <div className="bg-white rounded-2xl p-3 md:p-4 border border-pw-border shadow-pw-md">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-base">📊</span>
                            <h2 className="text-sm font-bold text-pw-violet">Your Progress</h2>
                        </div>
                        <StatsOverview />
                    </div>

                    {/* ── 4. Announcement Carousel ────────────────────────────── */}
                    <ModernCarousel />

                    {/* ── 5. Live Quiz Banner (time-sensitive, high urgency) ─── */}
                    <LiveQuizBanner />

                    {/* ── 6. All Study Modes Grid (core feature) ──────────────── */}
                    <section id="study-modes" aria-label="Study modes">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-base">🎯</span>
                            <h2 className="text-base font-bold text-pw-violet">Study & Play Modes</h2>
                        </div>
                        <ModernModeGrid />
                    </section>

                    {/* ── 7. Two-column layout for tablet & desktop ─────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">

                        {/* Left Column (2/3 width on large) */}
                        <div className="lg:col-span-2 space-y-4 md:space-y-5">

                            {/* Exam Countdown */}
                            <ExamCountdown />

                            {/* Gamification / XP Card */}
                            <GamificationCard />

                            {/* AI Performance Insights */}
                            <AIPerformanceCard />

                            {/* Bookmarks */}
                            <BookmarkedQuestionsSection />

                            {/* Notes */}
                            <NotesSection />

                            {/* Offline Tuition — mobile only (desktop in right col) */}
                            <div className="block lg:hidden">
                                <OfflineTuitionCard />
                            </div>
                        </div>

                        {/* Right Column (1/3 width on large) */}
                        <div className="space-y-4 md:space-y-5">

                            {/* AI Tools Card */}
                            <div className="bg-white rounded-2xl p-4 md:p-5 border border-pw-border shadow-pw-md">
                                <h2 className="text-base font-bold text-pw-violet mb-4 flex items-center gap-2">
                                    <span>🤖</span> AI Study Tools
                                </h2>
                                <div className="space-y-3">
                                    <AIQuestionGenerator />
                                    <AIFlashcardGenerator />
                                    <ChapterSummary />
                                </div>
                            </div>

                            {/* Community Discussions */}
                            <DiscussionSection />

                            {/* Offline Tuition — desktop only */}
                            <div className="hidden lg:block">
                                <OfflineTuitionCard />
                            </div>
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
