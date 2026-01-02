'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { HiArrowRight } from 'react-icons/hi'
import { TbSum } from 'react-icons/tb'
import { FaCrown, FaRocket } from 'react-icons/fa'
import { useLanguage } from '@/context/LanguageContext'

export const LandingHero = () => {
    const { t } = useLanguage()

    return (
        <section className="relative w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-1 relative z-10"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 bg-pw-indigo/5 border border-pw-indigo/20 rounded-full px-4 py-1.5 mb-6 shadow-sm"
                    >
                        <FaCrown className="text-pw-indigo text-sm" />
                        <span className="text-pw-indigo text-xs font-bold tracking-wide uppercase">India's Most Loved Learning Platform</span>
                    </motion.div>

                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold text-pw-violet dark:text-white mb-6 leading-tight max-w-2xl lg:max-w-none">
                        Master Your <br className="hidden lg:block" />
                        <span className="text-pw-indigo relative inline-block">
                            Exams
                            {/* Underline decoration */}
                            <svg className="absolute w-full h-3 -bottom-2 left-0 text-pw-lavender" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
                            </svg>
                        </span>
                    </h1>

                    <p className="text-gray-500 dark:text-gray-400 text-lg sm:text-xl font-body leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                        Experience the new era of learning with interactive quizzes, real-time battles, and smart performance analysis.
                    </p>

                    <div className="flex flex-col w-full sm:w-auto sm:flex-row gap-5 justify-center lg:justify-start">
                        <Link href="/login" className="w-full sm:w-auto">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full px-8 py-4 bg-gradient-to-r from-pw-indigo to-pw-violet text-white font-bold text-lg rounded-xl shadow-pw-md hover:shadow-pw-lg flex items-center justify-center gap-3 relative overflow-hidden group transition-all"
                            >
                                <span className="relative z-10 flex items-center gap-2">Start Practicing <HiArrowRight /></span>
                            </motion.button>
                        </Link>
                        <Link href="/signup" className="w-full sm:w-auto">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full px-8 py-4 bg-white dark:bg-slate-900 border border-pw-border dark:border-slate-800 text-pw-violet dark:text-white font-bold text-lg rounded-xl shadow-sm hover:bg-pw-surface dark:hover:bg-slate-800 transition-all"
                            >
                                Join for Free
                            </motion.button>
                        </Link>
                    </div>

                    <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 opacity-90">
                        <div className="flex -space-x-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 bg-pw-surface dark:bg-slate-800 relative overflow-hidden shadow-md">
                                    {/* Placeholder avatars can be replaced */}
                                    <div className="w-full h-full bg-gradient-to-br from-pw-indigo/20 to-pw-violet/20 flex items-center justify-center text-xs text-pw-indigo font-bold">{i}</div>
                                </div>
                            ))}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-bold text-pw-violet dark:text-white block text-lg">50k+</span>
                            Happy Students
                        </div>
                    </div>
                </motion.div>

                {/* Hero Visual */}
                <div className="relative w-full aspect-square lg:aspect-[4/3] order-1 lg:order-2 perspective-1000">
                    <motion.div
                        initial={{ opacity: 0, rotateY: 15, scale: 0.9 }}
                        animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                        transition={{ duration: 1, type: "spring" }}
                        className="relative w-full h-full rounded-[2rem] overflow-hidden border border-pw-border dark:border-slate-800 shadow-pw-xl bg-white dark:bg-slate-900"
                    >
                        <div className="absolute inset-2 rounded-[1.5rem] overflow-hidden bg-pw-surface dark:bg-slate-950">
                            {/* If image exists, use it, else fallback to a nice gradient/pattern */}
                            <Image
                                src="/assets/login-hero.png"
                                alt="Royal Education"
                                fill
                                className="object-cover hover:scale-105 transition-transform duration-700"
                                priority
                                onError={(e) => {
                                    // Fallback if image fails (optional handling)
                                    // e.currentTarget.style.display = 'none' 
                                }}
                            />
                            {/* Optional Overlay if image is too bright, but usually we want it bright for light theme */}
                            {/* <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div> */}
                        </div>

                        {/* Floating elements */}
                        <motion.div
                            animate={{ y: [-10, 10, -10] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="hidden sm:flex absolute top-10 right-10 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-pw-border dark:border-slate-800 rounded-2xl shadow-pw-lg"
                        >
                            <TbSum className="text-4xl text-pw-indigo" />
                        </motion.div>

                        <motion.div
                            animate={{ y: [10, -10, 10] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="hidden sm:flex absolute bottom-10 left-10 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-pw-border dark:border-slate-800 rounded-2xl shadow-pw-lg items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <FaRocket className="text-red-500" />
                            </div>
                            <div>
                                <span className="block text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">New</span>
                                <span className="text-pw-violet dark:text-white font-bold">Live Quizzes & Tests</span>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
