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
        <div className="bg-white rounded-3xl p-6 border border-pw-border shadow-md mb-6 relative overflow-hidden group">
            {/* Header / Loading Overlay */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <FaRobot />
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-gray-800 text-lg leading-tight">AI Coach</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                            {loading ? 'Analyzing...' : 'Performance Insights'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchAnalysis}
                    disabled={loading}
                    className={`w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center hover:bg-indigo-100 transition-colors ${loading ? 'animate-spin' : ''}`}
                >
                    <FaSync className="text-xs" />
                </button>
            </div>

            {loading && !insights ? (
                <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-16 bg-gray-50 rounded-xl w-full" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
            ) : insights ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    {/* Summary Bubble */}
                    <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 relative">
                        <div className="absolute top-0 left-4 -translate-y-1/2 bg-white text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-indigo-100 shadow-sm uppercase">
                            Summary
                        </div>
                        <p className="text-indigo-900 text-sm font-medium leading-relaxed">
                            "{insights.summary}"
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Tip */}
                        <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                            <div className="flex items-start gap-2 mb-1">
                                <FaLightbulb className="text-green-500 mt-0.5" />
                                <span className="text-green-700 font-bold text-xs uppercase">Study Tip</span>
                            </div>
                            <p className="text-green-800 text-xs leading-relaxed">
                                {insights.tip}
                            </p>
                        </div>

                        {/* Weak Area / Priority */}
                        {insights.weakAreas.length > 0 && (
                            <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                                <div className="flex items-start gap-2 mb-1">
                                    <FaExclamationTriangle className="text-red-500 mt-0.5" />
                                    <span className="text-red-700 font-bold text-xs uppercase">Focus On</span>
                                </div>
                                <p className="text-red-800 text-xs font-bold">
                                    {insights.weakAreas[0].subject} <span className="opacity-70 font-normal">({insights.weakAreas[0].accuracy}% Acc)</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Motivation Footer */}
                    <div className="text-center pt-2 border-t border-gray-100">
                        <p className="text-gray-400 text-xs italic">
                            {insights.motivation}
                        </p>
                    </div>

                </motion.div>
            ) : null}

            {/* Background Decor */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>
    );
};
