'use client'

import { motion } from 'framer-motion'
import { FaFire, FaBolt, FaCrown, FaRobot, FaLightbulb, FaSpinner } from 'react-icons/fa'
import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react'
import { GamificationStats } from '@/data/types'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface AIInsights {
    summary: string;
    tip: string;
    motivation: string;
}

export const GamificationCard = () => {
    const { userProfile, user } = useAuth()
    const [aiInsights, setAiInsights] = useState<AIInsights | null>(null)
    const [loadingInsights, setLoadingInsights] = useState(false)

    // Direct access with fallback - ensure currentStreak is always a number
    const rawGamification = userProfile?.gamification;
    const stats: GamificationStats = {
        xp: rawGamification?.xp || 0,
        level: rawGamification?.level || 1,
        currentStreak: typeof rawGamification?.currentStreak === 'number' ? rawGamification.currentStreak : (rawGamification?.currentStreak ? 1 : 0),
        lastPracticeDate: rawGamification?.lastPracticeDate || null,
        achievements: rawGamification?.achievements || []
    };

    // Level Logic: Quadratic Progression
    // Level L requires total XP = 50 * L * (L-1) to REACH (start of level L)
    // XP needed to pass Level L = L * 100.
    const calculatedLevel = Math.floor((1 + Math.sqrt(1 + 8 * (stats.xp / 100))) / 2);

    const xpStartOfCurrentLevel = 50 * (calculatedLevel - 1) * calculatedLevel;
    const xpRequiredForNextLevel = calculatedLevel * 100; // Requirement implies L * 100 to pass

    const xpInCurrentLevel = stats.xp - xpStartOfCurrentLevel;
    const xpNeeded = xpRequiredForNextLevel - xpInCurrentLevel;
    const progress = Math.min(100, Math.max(0, (xpInCurrentLevel / xpRequiredForNextLevel) * 100));

    // Fetch AI Insights
    useEffect(() => {
        const fetchInsights = async () => {
            if (!user?.uid) return;

            setLoadingInsights(true);
            try {
                // Fetch recent quiz results
                const resultsRef = collection(db, 'users', user.uid, 'quiz_results');
                const q = query(resultsRef, orderBy('completedAt', 'desc'), limit(20));
                const snapshot = await getDocs(q);

                const quizResults = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        subject: data.subject || 'General',
                        chapter: data.chapter || '',
                        score: data.score || 0,
                        total: data.totalQuestions || 10,
                        date: data.completedAt?.toDate?.()?.toISOString() || new Date().toISOString()
                    };
                });

                if (quizResults.length > 0) {
                    const response = await fetch('/api/ai/analyze', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            quizResults,
                            currentStreak: stats.currentStreak,
                            totalXP: stats.xp,
                            level: calculatedLevel
                        })
                    });

                    const data = await response.json();
                    if (data.success && data.insights) {
                        setAiInsights({
                            summary: data.insights.summary,
                            tip: data.insights.tip,
                            motivation: data.insights.motivation
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch AI insights:', error);
            } finally {
                setLoadingInsights(false);
            }
        };

        fetchInsights();
    }, [user?.uid, stats.xp, stats.currentStreak, calculatedLevel]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full relative z-10 group p-4 md:p-6 bg-white rounded-2xl border border-pw-border shadow-pw-md overflow-hidden"
        >
            {/* Subtle Accent Gradient Top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pw-lavender via-pw-indigo to-pw-violet rounded-t-2xl" />

            <div className="relative z-10 w-full">
                {/* Header Row - Compact */}
                <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                    <div>
                        <h3 className="text-lg md:text-xl font-display font-bold text-pw-violet leading-tight">Your Progress</h3>
                        <p className="text-xs md:text-sm text-pw-indigo font-medium line-clamp-1">Keep climbing, {user?.displayName?.split(' ')[0] || 'Champion'}! 🚀</p>
                    </div>

                    {/* Streak Badge - Compact */}
                    <div className="relative group/streak cursor-pointer shrink-0">
                        <div className="relative bg-gradient-to-r from-orange-500 to-pw-red text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md transition-shadow">
                            <FaFire className={`text-xs md:text-sm ${stats.currentStreak > 0 ? 'animate-pulse' : 'opacity-50'}`} />
                            <div className="flex flex-col leading-none">
                                <span className="text-sm md:text-base font-bold">{stats.currentStreak}</span>
                                <span className="text-[8px] uppercase tracking-wider opacity-90 font-bold">Streak</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Stats Area - Compact Grid */}
                <div className="flex items-center sm:items-start gap-3 md:gap-4">

                    {/* Level Circular Progress (Left) - Smaller on mobile */}
                    <div className="relative w-14 h-14 md:w-20 md:h-20 flex-shrink-0">
                        {/* SVG Circle - PW Colors */}
                        <svg className="w-full h-full transform -rotate-90">
                            {/* Track */}
                            <circle cx="50%" cy="50%" r="45%" className="stroke-pw-surface" strokeWidth="6" fill="transparent" />
                            {/* Progress */}
                            <circle
                                cx="50%" cy="50%" r="45%"
                                strokeWidth="6"
                                fill="transparent"
                                strokeLinecap="round"
                                strokeDasharray="282"
                                strokeDashoffset={`calc(282 - (282 * ${progress}) / 100)`}
                                style={{ transition: "stroke-dashoffset 1s ease-out", stroke: "url(#pwGradient)" }}
                            />
                            <defs>
                                <linearGradient id="pwGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#ABA3EC" />
                                    <stop offset="100%" stopColor="#4437B8" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Inner Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-[8px] font-bold uppercase text-pw-indigo tracking-wider">Lvl</span>
                            <span className="text-xl md:text-2xl font-black text-pw-violet font-display leading-none">
                                {calculatedLevel}
                            </span>
                        </div>

                        {/* Floating Crown Icon */}
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-gradient-to-br from-pw-indigo to-pw-violet text-white p-1 rounded-full shadow-sm border border-white text-[8px] z-20">
                            <FaCrown />
                        </div>
                    </div>

                    {/* XP & Level Info (Right) - Ensure min-w-0 */}
                    <div className="flex-1 w-full min-w-0 flex flex-col justify-center h-full pt-1">
                        <div className="flex justify-between items-end mb-1.5 gap-2">
                            <div className="min-w-0">
                                <p className="text-base md:text-xl font-black text-pw-violet flex items-center gap-1.5 leading-none truncate">
                                    {stats.xp} <span className="text-[10px] font-bold text-gray-400 self-end mb-0.5">XP</span>
                                </p>
                            </div>
                            <div className="text-right shrink-0 leading-none">
                                <p className="text-[10px] md:text-xs font-bold text-pw-indigo">{xpNeeded} XP Left</p>
                            </div>
                        </div>

                        {/* Custom Progress Bar - Slim */}
                        <div className="h-1.5 md:h-2 w-full bg-pw-surface rounded-full overflow-hidden border border-pw-border mb-3">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, ease: "circOut" }}
                                className="h-full bg-gradient-to-r from-pw-lavender to-pw-indigo rounded-full relative overflow-hidden"
                            >
                                {/* Shimmer Effect */}
                                <div className="absolute top-0 left-0 bottom-0 w-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer" />
                            </motion.div>
                        </div>

                        {/* Action Buttons - Moved up for compactness */}
                        <div className="flex gap-2">
                            <a href="/leaderboard" className="flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-lg font-bold text-[10px] md:text-xs border border-yellow-200 hover:bg-yellow-100 transition-all active:scale-95">
                                <FaCrown className="text-yellow-500 text-[10px]" /> Leaderboard
                            </a>
                        </div>
                    </div>
                </div>

                {/* AI Insights Section - Ultra Compact */}
                <div className="mt-3 pt-3 border-t border-dashed border-gray-100">
                    {loadingInsights ? (
                        <div className="flex items-center gap-2 text-xs text-pw-indigo">
                            <FaSpinner className="animate-spin" />
                            <span>AI analyzing...</span>
                        </div>
                    ) : aiInsights ? (
                        <div className="flex items-start gap-2 text-xs bg-pw-indigo/5 px-3 py-2 rounded-lg border border-pw-indigo/10">
                            <FaRobot className="text-pw-indigo mt-0.5 shrink-0" />
                            <div className="min-w-0">
                                <span className="text-gray-700 font-medium block truncate">{aiInsights.summary}</span>
                                {aiInsights.tip && <span className="text-pw-indigo text-[10px] block truncate opacity-80 mt-0.5">{aiInsights.tip}</span>}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-xs text-gray-500 px-2">
                            <FaBolt className="text-pw-indigo" />
                            <span className="truncate">Keep solving quizzes to unlock AI insights!</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
