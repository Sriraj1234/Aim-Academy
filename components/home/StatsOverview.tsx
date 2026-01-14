'use client'

import { motion } from 'framer-motion'
import { FaFire, FaCheckCircle, FaTrophy, FaChartLine, FaMapMarkerAlt, FaLock } from 'react-icons/fa'
import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react'
import { collection, query, where, getCountFromServer } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Animated counter hook (Use same logic as before)
const useAnimatedCounter = (endValue: number, duration: number = 1500) => {
    const [count, setCount] = useState(0)

    useEffect(() => {
        if (endValue === 0) return
        let startTime: number
        let animationFrame: number
        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime
            const progress = Math.min((currentTime - startTime) / duration, 1)
            const easeOutQuart = 1 - Math.pow(1 - progress, 4)
            setCount(Math.floor(easeOutQuart * endValue))
            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate)
            }
        }
        animationFrame = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(animationFrame)
    }, [endValue, duration])

    return count
}

export const StatsOverview = () => {
    const { user, userProfile } = useAuth()
    const [regionalRank, setRegionalRank] = useState(0)

    // Check if user is logged in
    if (!user) {
        return (
            <div className="relative overflow-hidden rounded-xl">
                {/* Blurred Placeholder Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 filter blur-sm select-none opacity-50 pointer-events-none">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white/50 p-2.5 rounded-xl border border-white/50 h-16">
                            <div className="w-8 h-8 bg-gray-200 rounded-lg mb-2" />
                            <div className="h-4 w-12 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>

                {/* Lock Overlay */}
                <div className="absolute inset-x-0 inset-y-0 flex flex-col items-center justify-center z-10 bg-white/10 backdrop-blur-[1px]">
                    <div className="bg-white p-2 rounded-full shadow-lg mb-2">
                        <FaLock className="text-pw-indigo text-lg" />
                    </div>
                    <p className="text-xs font-bold text-slate-600 mb-2">Track your progress</p>
                    <a href="/login" className="px-4 py-1.5 bg-pw-indigo text-white text-xs font-bold rounded-full hover:bg-pw-violet transition-colors shadow-lg shadow-indigo-200">
                        Login to View
                    </a>
                </div>
            </div>
        )
    }

    // Real data from Firebase
    const quizzesTaken = userProfile?.stats?.quizzesTaken || 0
    const avgScore = userProfile?.stats?.avgScore || 0
    const rank = userProfile?.stats?.rank || 0

    // Use streak from Firebase gamification (same source as GamificationCard)
    // Handle case where streak might be stored as boolean
    const rawStreak = userProfile?.gamification?.currentStreak;
    const streak = typeof rawStreak === 'number' ? rawStreak : (rawStreak ? 1 : 0)

    // Fetch Regional Rank
    useEffect(() => {
        const fetchRegionalRank = async () => {
            if (!userProfile?.pincode) return;
            if (userProfile?.stats?.avgScore === undefined || userProfile?.stats?.avgScore === null) return;

            try {
                const q = query(
                    collection(db, 'users'),
                    where('pincode', '==', userProfile.pincode),
                    where('stats.avgScore', '>', userProfile.stats.avgScore)
                )
                const snapshot = await getCountFromServer(q);
                setRegionalRank(snapshot.data().count + 1);
            } catch (err) {
                console.error("Error fetching regional rank:", err);
            }
        }
        fetchRegionalRank();
    }, [userProfile?.pincode, userProfile?.stats?.avgScore])

    // Animated values
    const animatedQuizzes = useAnimatedCounter(quizzesTaken)
    const animatedScore = useAnimatedCounter(avgScore)
    const animatedRank = useAnimatedCounter(rank)
    const animatedRegionalRank = useAnimatedCounter(regionalRank)
    const animatedStreak = useAnimatedCounter(streak)

    const stats = [
        {
            label: 'Day Streak',
            value: animatedStreak,
            suffix: '🔥',
            icon: FaFire,
            gradient: 'from-orange-500 to-red-500',
            borderColor: 'border-l-orange-500',
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-500'
        },
        {
            label: 'Quizzes',
            value: animatedQuizzes,
            suffix: '',
            icon: FaCheckCircle,
            gradient: 'from-emerald-500 to-green-500',
            borderColor: 'border-l-green-500',
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600'
        },
        {
            label: 'Accuracy',
            value: animatedScore,
            suffix: '%',
            icon: FaChartLine,
            gradient: 'from-blue-500 to-cyan-500',
            borderColor: 'border-l-blue-500',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600'
        },
        {
            label: 'True Local Rank',
            value: animatedRegionalRank || (!userProfile?.pincode ? 'No Loc' : '—'),
            suffix: '',
            icon: FaMapMarkerAlt,
            gradient: 'from-purple-500 to-pink-500',
            borderColor: 'border-l-pw-indigo',
            iconBg: 'bg-pw-lavender/20',
            iconColor: 'text-pw-indigo'
        }
    ]

    return (
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3`}>
            {stats.map((stat, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    className={`relative overflow-hidden bg-white/50 backdrop-blur-sm p-2.5 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all group`}
                >
                    {/* Background Gradient Blend */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`} />

                    <div className="relative z-10 flex items-center gap-3">
                        {/* Icon Box */}
                        <div className={`w-8 h-8 rounded-lg ${stat.iconBg} flex items-center justify-center shrink-0 shadow-inner`}>
                            <stat.icon className={`text-base ${stat.iconColor}`} />
                        </div>

                        <div className="flex flex-col min-w-0">
                            {/* Value */}
                            <div className="flex items-baseline gap-0.5">
                                <span className="text-lg md:text-xl font-black text-slate-800 tabular-nums leading-none">
                                    {stat.value}
                                </span>
                                {stat.suffix && (
                                    <span className="text-[10px] font-bold text-slate-400">
                                        {stat.suffix}
                                    </span>
                                )}
                            </div>
                            {/* Label */}
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate leading-tight mt-0.5">
                                {stat.label}
                            </p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}

