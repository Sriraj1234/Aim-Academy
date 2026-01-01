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

    // Level Logic
    const calculatedLevel = Math.floor(stats.xp / 100) + 1
    const xpForThisLevel = (calculatedLevel - 1) * 100

    // Progress within current level
    const xpInCurrentLevel = stats.xp - xpForThisLevel
    const progress = Math.min(100, Math.max(0, (xpInCurrentLevel / 100) * 100))
    const xpNeeded = 100 - xpInCurrentLevel

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
            className="w-full relative z-10 group p-4 md:p-8 bg-white rounded-2xl border border-pw-border shadow-pw-md overflow-hidden"
        >
            {/* Subtle Accent Gradient Top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pw-lavender via-pw-indigo to-pw-violet rounded-t-2xl" />

            <div className="relative z-10">
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between mb-4 md:mb-6 gap-3">
                    <div>
                        <h3 className="text-xl md:text-2xl font-display font-bold text-pw-violet leading-tight">Your Progress</h3>
                        <p className="text-sm md:text-base text-pw-indigo font-medium line-clamp-1">Keep climbing, {user?.displayName?.split(' ')[0] || 'Champion'}! 🚀</p>
                    </div>

                    {/* Streak Badge - PW Style */}
                    <div className="relative group/streak cursor-pointer shrink-0">
                        <div className="relative bg-gradient-to-r from-orange-500 to-pw-red text-white px-3 py-2 md:px-5 md:py-2.5 rounded-xl flex items-center gap-2 shadow-pw-md hover:shadow-pw-lg transition-shadow">
                            <FaFire className={`text-sm md:text-xl ${stats.currentStreak > 0 ? 'animate-pulse' : 'opacity-50'}`} />
                            <div className="flex flex-col leading-none">
                                <span className="text-sm md:text-lg font-bold">{stats.currentStreak}</span>
                                <span className="text-[8px] md:text-[10px] uppercase tracking-wider opacity-80 font-bold">Day Streak</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Stats Area */}
                <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8">

                    {/* Level Circular Progress (Left) */}
                    <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
                        {/* SVG Circle - PW Colors */}
                        <svg className="w-full h-full transform -rotate-90">
                            {/* Track */}
                            <circle cx="50%" cy="50%" r="45%" className="stroke-pw-surface" strokeWidth="8" fill="transparent" />
                            {/* Progress */}
                            <circle
                                cx="50%" cy="50%" r="45%"
                                strokeWidth="8"
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
                            <span className="text-[10px] md:text-xs font-bold uppercase text-pw-indigo tracking-wider">Level</span>
                            <span className="text-2xl md:text-4xl font-black text-pw-violet font-display">
                                {calculatedLevel}
                            </span>
                        </div>

                        {/* Floating Crown Icon */}
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-gradient-to-br from-pw-indigo to-pw-violet text-white p-1 md:p-1.5 rounded-full shadow-pw-md border-2 border-white text-[10px] md:text-xs z-20">
                            <FaCrown />
                        </div>
                    </div>

                    {/* XP & Level Info (Right) - Ensure min-w-0 for flex child truncation */}
                    <div className="flex-1 w-full min-w-0">
                        <div className="flex justify-between items-end mb-2 md:mb-3">
                            <div>
                                <p className="text-2xl md:text-3xl font-black text-pw-violet flex items-center gap-2">
                                    {stats.xp} <span className="text-xs md:text-sm font-bold text-gray-500 self-end mb-1">Total XP</span>
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-xs md:text-sm font-bold text-pw-indigo">{xpNeeded} XP</p>
                                <p className="text-[10px] md:text-xs text-gray-500 font-medium uppercase tracking-wide">To Level {calculatedLevel + 1}</p>
                            </div>
                        </div>

                        {/* Custom Progress Bar - PW Style */}
                        <div className="h-2 md:h-3 w-full bg-pw-surface rounded-full overflow-hidden border border-pw-border">
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

                        {/* AI Insights Section - PW Style */}
                        <div className="mt-4 md:mt-5">
                            {loadingInsights ? (
                                <div className="flex items-center gap-2 text-xs md:text-sm text-pw-indigo bg-pw-surface inline-flex px-3 py-1.5 rounded-lg border border-pw-border">
                                    <FaSpinner className="animate-spin text-pw-indigo" />
                                    <span>AI analyzing...</span>
                                </div>
                            ) : aiInsights ? (
                                <div className="space-y-2 md:space-y-3">
                                    <div className="flex items-start gap-2 md:gap-3 text-xs md:text-sm bg-pw-lavender/10 px-3 py-2 md:px-4 md:py-3 rounded-xl border border-pw-lavender/30">
                                        <div className="p-1 md:p-1.5 bg-pw-indigo/10 rounded-lg shrink-0">
                                            <FaRobot className="text-pw-indigo" />
                                        </div>
                                        <span className="text-gray-700 leading-relaxed">{aiInsights.summary}</span>
                                    </div>
                                    {aiInsights.tip && (
                                        <div className="flex items-start gap-2 md:gap-3 text-xs md:text-sm bg-orange-50 px-3 py-2 md:px-4 md:py-3 rounded-xl border border-orange-200">
                                            <div className="p-1 md:p-1.5 bg-orange-100 rounded-lg shrink-0">
                                                <FaLightbulb className="text-orange-500" />
                                            </div>
                                            <span className="text-gray-700 leading-relaxed">{aiInsights.tip}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs md:text-sm text-gray-600 font-medium flex items-center gap-2 bg-pw-surface inline-block px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-pw-border hover:bg-pw-lavender/10 transition-colors">
                                    <FaBolt className="text-pw-indigo" />
                                    <span>You are doing great! Keep solving quizzes to level up.</span>
                                </p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 md:mt-6 flex gap-3">
                            <a href="/leaderboard" className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-yellow-50 text-yellow-700 rounded-xl font-bold text-xs md:text-sm border border-yellow-200 hover:bg-yellow-100 transition-all active:scale-95 transform">
                                <FaCrown className="text-yellow-500" /> View Leaderboard
                            </a>
                        </div>

                    </div>
                </div>
            </div>
        </motion.div>
    )
}
