'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { FaFire, FaTrophy, FaArrowRight, FaStar, FaPlay } from 'react-icons/fa'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export const ModernHero = () => {
    const { user, userProfile } = useAuth()
    const name = user?.displayName?.split(' ')[0] || userProfile?.displayName?.split(' ')[0] || 'Student'

    // Calculate streak - fallback to 0 if not present
    const streak = userProfile?.gamification?.currentStreak || 0

    return (
        <section className="relative w-full max-w-7xl mx-auto mb-10 overflow-hidden font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] rounded-[2.5rem] p-8 md:p-12 overflow-hidden shadow-2xl"
            >
                {/* Abstract Background Shapes */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-900 opacity-20 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4" />

                    {/* Floating Particles */}
                    <motion.div
                        animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/4 right-1/4 w-4 h-4 rounded-full bg-white opacity-20 blur-[1px]"
                    />
                    <motion.div
                        animate={{ y: [0, 30, 0], opacity: [0.2, 0.5, 0.2] }}
                        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute bottom-1/3 left-1/3 w-6 h-6 rounded-full bg-yellow-400 opacity-20 blur-[1px]"
                    />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">

                    {/* Left Content */}
                    <div className="w-full md:w-3/5 text-center md:text-left">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6 group cursor-default hover:bg-white/15 transition-colors"
                        >
                            <span className="text-amber-300 text-lg group-hover:scale-110 transition-transform"><FaFire /></span>
                            <span className="text-white/90 text-sm font-bold tracking-wide uppercase">{streak} Day Streak! Keep it up</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-4xl md:text-6xl font-black text-white leading-[1.1] mb-6 drop-shadow-lg font-display"
                        >
                            Ready to learn, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-200">
                                {name}?
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-indigo-100 text-lg md:text-xl font-medium mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed"
                        >
                            Complete your daily quiz to maintain your streak and earn double XP today!
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4"
                        >
                            <Link href="/play/selection" className="w-full sm:w-auto">
                                <button className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-700 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-900/20 hover:shadow-2xl hover:-translate-y-1 hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 group active:scale-95">
                                    <FaPlay className="text-sm group-hover:scale-110 transition-transform" />
                                    <span>Start Practice</span>
                                </button>
                            </Link>

                            <Link href="/leaderboard" className="w-full sm:w-auto">
                                <button className="w-full sm:w-auto px-8 py-4 bg-indigo-800/40 backdrop-blur-md border border-indigo-400/30 text-white rounded-2xl font-bold text-lg hover:bg-indigo-800/60 transition-all flex items-center justify-center gap-3 hover:-translate-y-1 active:scale-95">
                                    <FaTrophy className="text-yellow-400" />
                                    <span>Leaderboard</span>
                                </button>
                            </Link>
                        </motion.div>
                    </div>

                    {/* Right Illustration (3D Style) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                        className="w-full md:w-2/5 flex justify-center md:justify-end"
                    >
                        <div className="relative w-72 h-72 md:w-80 md:h-80">
                            {/* Glass Card Floating */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-2xl transform rotate-6 z-10 flex flex-col items-center justify-center p-6 text-center group hover:rotate-2 transition-transform duration-500">
                                <div className="w-20 h-20 bg-gradient-to-br from-amber-300 to-orange-400 rounded-2xl mb-4 shadow-lg flex items-center justify-center text-3xl text-white">
                                    <FaStar />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-1">New Challenge</h3>
                                <p className="text-white/60 text-sm font-medium mb-4">Physics: Light & Reflection</p>
                                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full w-2/3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
                                </div>
                                <p className="text-xs text-white/40 mt-2 font-mono">120/150 Students Played</p>
                            </div>

                            {/* Decorative Elements behind */}
                            <div className="absolute -inset-4 bg-indigo-500/30 rounded-[2.5rem] blur-xl -z-10 animate-pulse" />
                        </div>
                    </motion.div>

                </div>
            </motion.div>
        </section>
    )
}
