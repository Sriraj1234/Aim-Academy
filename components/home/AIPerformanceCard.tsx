'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaRobot, FaLightbulb, FaChartLine, FaExclamationTriangle, FaSync } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AIInsights {
    summary: string;
    tip: string;
    motivation: string;
    weakAreas: { subject: string; accuracy: number }[];
    strengths: { subject: string; accuracy: number }[];
}

export const AIPerformanceCard = () => {
    const { user, userProfile } = useAuth();
    const [insights, setInsights] = useState<AIInsights | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<number>(0);

    const fetchAnalysis = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Fetch recent results locally for freshness
            const resultsRef = collection(db, 'users', user.uid, 'quiz_results');
            const q = query(resultsRef, orderBy('date', 'desc'), limit(10));
            const snapshot = await getDocs(q);

            const recentResults = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    subject: data.subject || 'General',
                    chapter: data.chapter || 'All', // Safe fallback
                    score: data.score || 0,
                    total: data.totalMarks || data.totalQuestions || 0,
                    date: data.date
                };
            }).filter(r => r.total > 0);

            if (recentResults.length === 0) {
                setInsights(null); // No data state
                setLoading(false);
                return;
            }

            // 2. Call AI API
            const response = await fetch('/api/ai/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quizResults: recentResults,
                    currentStreak: userProfile?.gamification?.currentStreak || 0,
                    totalXP: userProfile?.gamification?.xp || 0,
                    level: userProfile?.gamification?.level || 1
                })
            });

            const data = await response.json();
            if (data.success && data.insights) {
                setInsights(data.insights);
                setLastUpdated(Date.now());
            }

        } catch (error) {
            console.error("AI Analysis failed:", error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch on mount if not fresh
    useEffect(() => {
        fetchAnalysis();
    }, [user]);

    if (!user) return null;

    if (!insights && !loading) {
        // Empty State
        return (
            <div className="bg-white rounded-3xl p-6 border border-pw-border shadow-sm mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gray-200" />
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                        <FaRobot className="text-xl" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-700">No Analysis Yet</h3>
                        <p className="text-xs text-gray-500">Take a quiz to get AI insights!</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-4 border border-pw-border shadow-md mb-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70" />

            {/* Compact Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                        <FaRobot className="text-sm" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm leading-tight">AI Coach</h3>
                        <p className="text-[10px] text-gray-500 font-medium">Daily Insights</p>
                    </div>
                </div>
                <button
                    onClick={fetchAnalysis}
                    disabled={loading}
                    className={`p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-indigo-600 transition-colors ${loading ? 'animate-spin' : ''}`}
                >
                    <FaSync className="text-xs" />
                </button>
            </div>

            {loading && !insights ? (
                <div className="space-y-2 animate-pulse py-2">
                    <div className="h-2 bg-gray-100 rounded w-3/4" />
                    <div className="h-10 bg-gray-50 rounded-lg w-full" />
                </div>
            ) : !insights ? (
                <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-xs text-gray-500 font-medium">Solve quizzes to unlock insights!</p>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-3"
                >
                    {/* Main Summary - Direct & Clean */}
                    <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100">
                        <p className="text-indigo-900 text-xs font-medium leading-relaxed">
                            <span className="font-bold text-indigo-700 mr-1">Insight:</span>
                            {insights.summary}
                        </p>
                    </div>

                    {/* Tip & Weakness Grid */}
                    <div className="grid grid-cols-2 gap-2">
                        {/* Tip */}
                        <div className="bg-emerald-50/50 rounded-xl p-2.5 border border-emerald-100/50">
                            <div className="flex items-center gap-1.5 mb-1">
                                <FaLightbulb className="text-emerald-500 text-[10px]" />
                                <span className="text-emerald-700 font-bold text-[9px] uppercase tracking-wide">Tip</span>
                            </div>
                            <p className="text-emerald-800 text-[10px] leading-snug line-clamp-2">
                                {insights.tip}
                            </p>
                        </div>

                        {/* Focus Area */}
                        {insights.weakAreas.length > 0 ? (
                            <div className="bg-rose-50/50 rounded-xl p-2.5 border border-rose-100/50">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <FaExclamationTriangle className="text-rose-500 text-[10px]" />
                                    <span className="text-rose-700 font-bold text-[9px] uppercase tracking-wide">Focus</span>
                                </div>
                                <p className="text-rose-800 text-[10px] font-bold truncate">
                                    {insights.weakAreas[0].subject}
                                </p>
                                <p className="text-rose-600/80 text-[9px]">
                                    {insights.weakAreas[0].accuracy}% Accuracy
                                </p>
                            </div>
                        ) : (
                            <div className="bg-blue-50/50 rounded-xl p-2.5 border border-blue-100/50 flex flex-col justify-center">
                                <div className="flex items-center gap-1.5">
                                    <FaChartLine className="text-blue-500 text-[10px]" />
                                    <span className="text-blue-700 font-bold text-[9px] uppercase">All Good!</span>
                                </div>
                                <p className="text-blue-600 text-[9px] mt-0.5">Keep maintaining your streak.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Motivation */}
                    <p className="text-gray-400 text-[10px] text-center italic mt-1">
                        "{insights.motivation}"
                    </p>

                </motion.div>
            )}

            {/* Subtle Decor */}
            <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-xl pointer-events-none" />
        </div>
    );
};
