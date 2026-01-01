'use client'

import { Header } from '@/components/shared/Header'
import { DashboardHeader } from '@/components/home/DashboardHeader'
import { StatsOverview } from '@/components/home/StatsOverview'
import { ModernModeGrid } from '@/components/home/ModernModeGrid'
import { ModernCarousel } from '@/components/home/ModernCarousel'
import { DailyChallengeCard } from '@/components/home/DailyChallengeCard'
import { GamificationCard } from '@/components/home/GamificationCard'
import { AIChatWidget } from '@/components/shared/AIChatWidget'
import { AIQuestionGenerator } from '@/components/home/AIQuestionGenerator'
import { ChapterSummary } from '@/components/home/ChapterSummary'
import { AIFlashcardGenerator } from '@/components/home/AIFlashcardGenerator'
import { BookmarkedQuestionsSection } from '@/components/home/BookmarkedQuestionsSection'
import { NotesSection } from '@/components/home/NotesSection'
import { AIPerformanceCard } from '@/components/home/AIPerformanceCard'

export default function DashboardPage() {
    return (
        // Root Container: Full width, no margin, no padding - just overflow protection
        <div className="min-h-screen w-full bg-pw-surface font-sans selection:bg-pw-indigo selection:text-white overflow-x-hidden">
            <Header />

            {/* Main Content Area */}
            <main className="pt-20 pb-24 w-full">

                {/* Dashboard Header Section - Centered with consistent padding */}
                <section className="w-full px-4 mb-6">
                    <div className="max-w-7xl mx-auto">
                        <DashboardHeader />
                    </div>
                </section>

                {/* Hero Carousel - Full width on mobile, contained on desktop */}
                <section className="w-full mb-6">
                    <div className="max-w-7xl mx-auto">
                        <ModernCarousel />
                    </div>
                </section>

                {/* Main Dashboard Grid - Centered with consistent padding */}
                <section className="w-full px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid lg:grid-cols-3 gap-6">

                            {/* Left Column: Main Content */}
                            <div className="lg:col-span-2 space-y-6">
                                <DailyChallengeCard />
                                <GamificationCard />
                                <AIPerformanceCard />

                                {/* Stats Overview Card */}
                                <div className="bg-white rounded-2xl p-4 md:p-5 border border-pw-border shadow-pw-md">
                                    <h3 className="text-lg font-bold text-pw-violet mb-4 flex items-center gap-2">
                                        <span className="text-xl">📊</span> Overview
                                    </h3>
                                    <StatsOverview />
                                </div>

                                {/* Study Modes Section */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-pw-violet pl-3 border-l-4 border-pw-indigo">
                                        Study Modes
                                    </h3>
                                    <ModernModeGrid />
                                </div>

                                {/* Bookmarked Questions */}
                                <BookmarkedQuestionsSection />

                                {/* Notes Section */}
                                <NotesSection />
                            </div>

                            {/* Right Column: AI Tools */}
                            <div className="space-y-4">
                                <div className="bg-white rounded-2xl p-4 md:p-5 border border-pw-border shadow-pw-md">
                                    <h3 className="text-lg font-bold text-pw-violet mb-4 flex items-center gap-2">
                                        <span className="text-xl">🤖</span> AI Study Tools
                                    </h3>
                                    <div className="space-y-3">
                                        <AIQuestionGenerator />
                                        <AIFlashcardGenerator />
                                        <ChapterSummary />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

            </main>

            {/* AI Chat Widget - Fixed Position */}
            <AIChatWidget />
        </div>
    )
}

