'use client'

import { Header } from '@/components/shared/Header'
import { DashboardHeader } from '@/components/home/DashboardHeader'
import { StatsOverview } from '@/components/home/StatsOverview'
import { ModernModeGrid } from '@/components/home/ModernModeGrid'
import { ModernCarousel } from '@/components/home/ModernCarousel'
import { GamificationCard } from '@/components/home/GamificationCard'
import { AIChatWidget } from '@/components/shared/AIChatWidget'
import { AIQuestionGenerator } from '@/components/home/AIQuestionGenerator'
import { ChapterSummary } from '@/components/home/ChapterSummary'
import Link from 'next/link'
import { FaMicrophone } from 'react-icons/fa'

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-pw-surface pb-20 font-sans selection:bg-pw-indigo selection:text-white">
            <Header />

            <main className="pt-20 px-4 max-w-7xl mx-auto space-y-6">
                <DashboardHeader />

                {/* Hero Carousel - PW Style */}
                <ModernCarousel />

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column: Stats & Gamification */}
                    <div className="lg:col-span-2 space-y-6">
                        <GamificationCard />

                        {/* Stats Overview - PW Style Card */}
                        <div className="bg-white rounded-2xl p-5 border border-pw-border shadow-pw-md">
                            <h3 className="text-lg font-bold text-pw-violet mb-4 flex items-center gap-2">
                                <span className="text-xl">📊</span> Overview
                            </h3>
                            <StatsOverview />
                        </div>
                    </div>

                    {/* Right Column: AI Tools - PW Style */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl p-5 border border-pw-border shadow-pw-md">
                            <h3 className="text-lg font-bold text-pw-violet mb-4 flex items-center gap-2">
                                <span className="text-xl">🤖</span> AI Study Tools
                            </h3>
                            <div className="space-y-3">
                                {/* Live Guru Card - PW Style */}
                                {/* Live Guru Card Removed as per request */}

                                <AIQuestionGenerator />
                                <ChapterSummary />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <h3 className="text-xl font-bold text-pw-violet mb-4 pl-3 border-l-4 border-pw-indigo">
                        Study Modes
                    </h3>
                    <ModernModeGrid />
                </div>
            </main>

            {/* AI Study Buddy Chat */}
            <AIChatWidget />
        </div>
    )
}
