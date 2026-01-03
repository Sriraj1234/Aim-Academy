'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { FaBookOpen, FaLayerGroup, FaUsers, FaArrowRight, FaHistory, FaClock, FaFire, FaStar, FaExclamationTriangle, FaYoutube, FaBrain, FaMicrophone, FaCamera } from 'react-icons/fa'
import { useLanguage } from '@/context/LanguageContext'

export const ModernModeGrid = () => {
    const { t } = useLanguage()

    const modes = [
        {
            id: 'group',
            title: 'Play with Friends',
            desc: 'Compete in real-time with your classmates!',
            icon: FaUsers,
            gradient: 'from-pw-indigo to-pw-violet',
            shadow: 'shadow-pw-md',
            bgGlow: 'bg-pw-indigo',
            badge: 'HOT',
            badgeColor: 'bg-pw-red',
            delay: 0.1
        },
        {
            id: 'mistakes',
            title: 'Mistake Notebook',
            desc: 'Master your weak areas',
            icon: FaExclamationTriangle,
            gradient: 'from-orange-500 to-red-500',
            shadow: 'shadow-orange-500/20',
            bgGlow: 'bg-orange-500',
            badge: 'NEW',
            badgeColor: 'bg-red-500',
            delay: 0.15
        },
        {
            id: 'subject',
            title: t('playMode.subject.title'),
            desc: 'Practice any subject deeply',
            icon: FaBookOpen,
            gradient: 'from-blue-500 to-cyan-500',
            shadow: 'shadow-blue-500/20',
            bgGlow: 'bg-blue-500',
            badge: null,
            badgeColor: '',
            delay: 0.2
        },
        {
            id: 'chapter',
            title: t('playMode.chapter.title'),
            desc: 'Focus on specific chapters',
            icon: FaLayerGroup,
            gradient: 'from-emerald-500 to-green-500',
            shadow: 'shadow-green-500/20',
            bgGlow: 'bg-green-500',
            badge: 'POPULAR',
            badgeColor: 'bg-gradient-to-r from-pw-violet to-pw-indigo',
            delay: 0.3
        },
        {
            id: 'study-hub',
            title: 'Study Hub',
            desc: 'Free video lectures & resources',
            icon: FaYoutube,
            gradient: 'from-red-500 to-pink-500',
            shadow: 'shadow-red-500/20',
            bgGlow: 'bg-red-500',
            badge: 'FREE',
            badgeColor: 'bg-red-600',
            delay: 0.35
        }
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-pw-violet flex items-center gap-2">
                    <FaFire className="text-orange-500" />
                    Start Playing
                </h2>
                <Link href="/play/selection" className="text-sm font-bold text-purple-300 hover:text-white flex items-center gap-1 transition-colors">
                    View All <FaArrowRight className="text-xs" />
                </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                {modes.map((mode) => (
                    <Link
                        href={
                            mode.id === 'group' ? '/play/group' :
                                mode.id === 'mistakes' ? '/mistakes' :
                                    mode.id === 'subject' ? '/play/selection?mode=subject' :
                                        mode.id === 'study-hub' ? '/study-hub' : // NEW ROUTE
                                            '/play/selection'
                        }
                        key={mode.id}
                        className="block w-full"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: mode.delay, type: "spring", stiffness: 200 }}
                            whileHover={{
                                y: -8,
                                scale: 1.02,
                                transition: { duration: 0.2 }
                            }}
                            whileTap={{ scale: 0.96 }}
                            className={`group relative h-full bg-white rounded-2xl p-5 hover:shadow-pw-lg transition-all overflow-hidden cursor-pointer border ${mode.id === 'group' ? 'border-pw-indigo shadow-pw-md bg-pw-surface/50' : 'border-pw-border hover:border-pw-indigo/30'}`}
                        >
                            {/* Special Ring for Group Mode */}
                            {mode.id === 'group' && (
                                <div className="absolute inset-0 rounded-2xl border-2 border-pw-indigo/10 group-hover:border-pw-indigo/30 transition-colors pointer-events-none" />
                            )}
                            {/* Animated background glow on hover */}
                            <div className={`absolute -right-10 -top-10 w-32 h-32 ${mode.bgGlow} opacity-0 group-hover:opacity-5 rounded-full blur-3xl transition-opacity duration-500`} />

                            {/* Badge */}
                            {mode.badge && (
                                <div className={`absolute top-3 right-3 px-2 py-0.5 ${mode.badgeColor} rounded-full z-20 shadow-sm ${mode.id === 'group' ? 'animate-pulse shadow-md' : ''}`}>
                                    <span className="text-[10px] font-black text-white tracking-wider">{mode.badge}</span>
                                </div>
                            )}

                            <div className="relative z-10">
                                {/* Icon with gradient background */}
                                <div className={`w-12 h-12 mb-4 rounded-xl bg-gradient-to-br ${mode.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                    <mode.icon className="text-xl" />
                                </div>

                                <h3 className="text-lg font-bold text-pw-violet mb-2 group-hover:text-pw-indigo transition-colors">
                                    {mode.title}
                                </h3>

                                <p className="text-gray-500 text-sm leading-relaxed mb-4 group-hover:text-gray-600 transition-colors">
                                    {mode.desc}
                                </p>

                                <div className="flex items-center text-sm font-bold text-pw-indigo/40 group-hover:text-pw-indigo transition-colors">
                                    <span>Start Now</span>
                                    <FaArrowRight className="ml-2 transform group-hover:translate-x-2 transition-transform" />
                                </div>
                            </div>
                        </motion.div>
                    </Link>
                ))}

                {/* Brain Warmup Card */}
                <Link
                    href="/play/mind-game"
                    className="block w-full"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                        whileHover={{
                            y: -8,
                            scale: 1.02,
                            transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.96 }}
                        className="group relative h-full bg-white rounded-2xl p-5 hover:shadow-pw-lg transition-all overflow-hidden cursor-pointer border border-pw-border hover:border-pw-indigo/30"
                    >
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500 opacity-0 group-hover:opacity-5 rounded-full blur-3xl transition-opacity duration-500" />

                        <div className="absolute top-3 right-3 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full z-20 shadow-sm">
                            <span className="text-[10px] font-black text-white tracking-wider">GAME</span>
                        </div>

                        <div className="relative z-10">
                            <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                                <FaBrain className="text-xl" />
                            </div>

                            <h3 className="text-lg font-bold text-pw-violet mb-2 group-hover:text-pw-indigo transition-colors">
                                Brain Warmup
                            </h3>

                            <p className="text-gray-500 text-sm leading-relaxed mb-4 group-hover:text-gray-600 transition-colors">
                                Quick visual puzzles to focus your mind.
                            </p>

                            <div className="flex items-center text-sm font-bold text-pw-indigo/40 group-hover:text-pw-indigo transition-colors">
                                <span>Play Now</span>
                                <FaArrowRight className="ml-2 transform group-hover:translate-x-2 transition-transform" />
                            </div>
                        </div>
                    </motion.div>
                </Link>



                {/* Snap & Solve Card */}
                <Link
                    href="/play/snap-solve"
                    className="block w-full"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                        whileHover={{
                            y: -8,
                            scale: 1.02,
                            transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.96 }}
                        className="group relative h-full bg-white rounded-2xl p-5 hover:shadow-pw-lg transition-all overflow-hidden cursor-pointer border border-pw-border hover:border-pw-indigo/30"
                    >
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500 opacity-0 group-hover:opacity-5 rounded-full blur-3xl transition-opacity duration-500" />

                        <div className="absolute top-3 right-3 px-2 py-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full z-20 shadow-sm">
                            <span className="text-[10px] font-black text-white tracking-wider">BETA</span>
                        </div>

                        <div className="relative z-10">
                            <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                                <FaCamera className="text-xl" />
                            </div>

                            <h3 className="text-lg font-bold text-pw-violet mb-2 group-hover:text-pw-indigo transition-colors">
                                Snap & Solve
                            </h3>

                            <p className="text-gray-500 text-sm leading-relaxed mb-4 group-hover:text-gray-600 transition-colors">
                                Upload photo & get step-by-step solution.
                            </p>

                            <div className="flex items-center text-sm font-bold text-pw-indigo/40 group-hover:text-pw-indigo transition-colors">
                                <span>Try Solver</span>
                                <FaArrowRight className="ml-2 transform group-hover:translate-x-2 transition-transform" />
                            </div>
                        </div>
                    </motion.div>
                </Link>
            </div>

            {/* Coming Soon Banner */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="relative bg-gradient-to-r from-pw-violet to-pw-indigo border border-white/10 rounded-2xl p-6 overflow-hidden shadow-pw-md"
            >
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-10" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/10">
                            <FaClock className="text-2xl text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Coming Soon</span>
                                <span className="flex items-center gap-1 text-xs font-bold text-yellow-300">
                                    <FaStar /> Exclusive
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-white">Weekly All-India Mock Tests</h3>
                        </div>
                    </div>
                    <button className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-bold text-sm transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                        Notify Me
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

