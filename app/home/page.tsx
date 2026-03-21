'use client'

import { Header } from '@/components/shared/Header'
import { Sidebar } from '@/components/shared/Sidebar'
import { BottomNav } from '@/components/shared/BottomNav'
import { DashboardHeader } from '@/components/home/DashboardHeader'
import { HeroBento } from '@/components/home/HeroBento'
import { StudyModules } from '@/components/home/StudyModules'
import { CommunityFeedPreview } from '@/components/home/CommunityFeedPreview'
import { AIChatWidget } from '@/components/shared/AIChatWidget'
import { Footer } from '@/components/shared/Footer'
import dynamic from 'next/dynamic'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { InteractiveLoading } from '@/components/shared/InteractiveLoading'

// Components with user/auth data - disable SSR to prevent hydration mismatches
const TrialReminderModal = dynamic(() => import('@/components/subscription/TrialReminderModal').then(m => m.TrialReminderModal), { ssr: false })

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
            if (scrollSaverRef.current) clearTimeout(scrollSaverRef.current);
        };
    }, []);

    if (loading) return <InteractiveLoading message="Loading Dashboard..." fullScreen />

    return (
        <div className="min-h-screen bg-background font-body text-on-surface antialiased overflow-x-hidden selection:bg-primary/20 selection:text-primary pb-20 md:pb-0">
            {/* Top Navigation Frame */}
            <Header />

            {/* Side Navigation Frame (Desktop) */}
            <Sidebar />

            {/* Main Content Canvas */}
            <main className="lg:ml-72 pt-28 px-4 md:px-8 pb-12 min-h-screen">
                <div className="max-w-7xl mx-auto space-y-10">
                    {/* Greeting & Daily Progress Section */}
                    <DashboardHeader />

                    {/* Hero Bento Section */}
                    <HeroBento />

                    {/* Study Modules Grid */}
                    <StudyModules />

                    {/* Community Feed Preview */}
                    <CommunityFeedPreview />
                </div>
            </main>

            {/* Mobile Bottom Navigation Layer */}
            <BottomNav />

            {/* Global Widgets */}
            <AIChatWidget />
            <TrialReminderModal />
            
            {/* Standard Footer - pushed below side navigation layout if needed, though for an app like this, footer might be hidden on dashboard, but keeping it for safety */}
            <div className="lg:ml-72">
                <Footer />
            </div>
        </div>
    )
}
