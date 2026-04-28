'use client'

import { Header } from '@/components/shared/Header'
import { ModernModeGrid } from '@/components/home/ModernModeGrid'
import { ModernCarousel } from '@/components/home/ModernCarousel'
import { QuickActionStrip } from '@/components/home/QuickActionStrip'
import dynamic from 'next/dynamic'
import { useAuth } from '@/context/AuthContext'
import { useEffect, useRef } from 'react'
import { InteractiveLoading } from '@/components/shared/InteractiveLoading'
import { RenderAfterIdle, RenderOnVisible } from '@/components/shared/RenderOnVisible'

import { DashboardHeader } from '@/components/home/DashboardHeader'
import { StatsOverview } from '@/components/home/StatsOverview'
import { LiveQuizBanner } from '@/components/home/LiveQuizBanner'
import { GamificationCard } from '@/components/home/GamificationCard'
import { ExamCountdown } from '@/components/home/ExamCountdown'

const Footer = dynamic(() => import('@/components/shared/Footer').then(m => m.Footer))
const AIChatWidget = dynamic(() => import('@/components/shared/AIChatWidget').then(m => m.AIChatWidget), { ssr: false })

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
    const { loading } = useAuth()
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
        <div className="relative min-h-screen bg-[#f8f9fa] pb-20 font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">
            {/* Buttery Smooth Ambient Background - Hardware Accelerated */}
            <div className="fixed inset-0 pointer-events-none z-0" style={{ transform: "translateZ(0)" }}>
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.06)_0%,_transparent_60%)] rounded-full" />
                <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.05)_0%,_transparent_50%)] rounded-full" />
                <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-[radial-gradient(circle_at_center,_rgba(236,72,153,0.03)_0%,_transparent_60%)] rounded-full" />
            </div>

            <div className="relative z-10">
                <Header />

            <main className="pt-20 pb-16 md:pt-24 md:pb-20">
                <div className="px-5 max-w-7xl mx-auto space-y-6 md:space-y-8 w-full overflow-x-hidden">

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
                            <RenderOnVisible fallback={<div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />}>
                                <AIPerformanceCard />
                            </RenderOnVisible>

                            {/* Bookmarks */}
                            <RenderOnVisible fallback={<div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />}>
                                <BookmarkedQuestionsSection />
                            </RenderOnVisible>

                            {/* Notes */}
                            <RenderOnVisible fallback={<div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />}>
                                <NotesSection />
                            </RenderOnVisible>

                            {/* Offline Tuition — mobile only (desktop in right col) */}
                            <div className="block lg:hidden">
                                <RenderOnVisible fallback={<div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />}>
                                    <OfflineTuitionCard />
                                </RenderOnVisible>
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
                                    <RenderOnVisible minHeight={72} fallback={<div className="h-16 bg-gray-100 rounded-2xl animate-pulse" />}>
                                        <AIFlashcardGenerator />
                                    </RenderOnVisible>
                                    <RenderOnVisible minHeight={72} fallback={<div className="h-16 bg-gray-100 rounded-2xl animate-pulse" />}>
                                        <ChapterSummary />
                                    </RenderOnVisible>
                                </div>
                            </div>

                            {/* Community Discussions */}
                            <RenderOnVisible fallback={<div className="h-52 bg-gray-100 rounded-2xl animate-pulse" />}>
                                <DiscussionSection />
                            </RenderOnVisible>

                            {/* Offline Tuition — desktop only */}
                            <div className="hidden lg:block">
                                <RenderOnVisible fallback={<div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />}>
                                    <OfflineTuitionCard />
                                </RenderOnVisible>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <RenderAfterIdle>
                <DailyChallengeCard />
                <AIChatWidget />
                <TrialReminderModal />
            </RenderAfterIdle>
            <Footer />
            </div>
        </div>
    )
}
