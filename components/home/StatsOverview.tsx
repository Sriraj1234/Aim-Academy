'use client'

import { motion } from 'framer-motion'
import { FaFire, FaCheckCircle, FaTrophy, FaChartLine, FaMapMarkerAlt } from 'react-icons/fa'
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
    const { userProfile } = useAuth()
    const [regionalRank, setRegionalRank] = useState(0)

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
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-3`}>
            {stats.map((stat, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className={`relative overflow-hidden bg-white p-3 rounded-xl shadow-pw-sm border border-pw-border border-l-4 ${stat.borderColor} group cursor-default hover:shadow-pw-md transition-shadow`}
                >
                    <div className="relative z-10 flex flex-col">
                        <div className={`w-8 h-8 mb-2 rounded-lg ${stat.iconBg} flex items-center justify-center ${stat.iconColor}`}>
                            <stat.icon className="text-sm" />
                        </div>

                        <div className="flex items-baseline gap-1">
                            <span className="text-xl md:text-2xl font-black text-pw-violet tabular-nums">
                                {stat.value}
                            </span>
                            {stat.suffix && (
                                <span className="text-sm md:text-base font-bold text-gray-400">
                                    {stat.suffix}
                                </span>
                            )}
                        </div>

                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                            {stat.label}
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}

