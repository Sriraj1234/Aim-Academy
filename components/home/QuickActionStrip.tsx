'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { FaLayerGroup, FaUsers, FaBookOpen, FaBrain } from 'react-icons/fa'

const ACTIONS = [
    {
        label: 'Practice',
        sublabel: 'Chapter MCQ',
        icon: FaLayerGroup,
        href: '/play/selection',
        gradient: 'from-indigo-500 to-violet-600',
        glow: 'shadow-indigo-200',
        ping: true,
    },
    {
        label: 'Play',
        sublabel: 'With Friends',
        icon: FaUsers,
        href: '/play/group',
        gradient: 'from-orange-500 to-red-500',
        glow: 'shadow-orange-200',
        ping: false,
        badge: '🔥'
    },
    {
        label: 'Study Hub',
        sublabel: 'Free Videos',
        icon: FaBookOpen,
        href: '/study-hub',
        gradient: 'from-emerald-500 to-teal-500',
        glow: 'shadow-emerald-200',
        ping: false,
    },
    {
        label: 'AI Tutor',
        sublabel: 'Ask Anything',
        icon: FaBrain,
        href: '/ai-chat',
        gradient: 'from-purple-500 to-pink-500',
        glow: 'shadow-purple-200',
        ping: false,
    },
]

export const QuickActionStrip = () => {
    return (
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
            {ACTIONS.map((action, i) => {
                const Icon = action.icon
                return (
                    <motion.div
                        key={action.label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07, type: 'spring', stiffness: 280 }}
                    >
                        <Link
                            href={action.href}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg ${action.glow} group-hover:scale-110 group-active:scale-95 transition-transform duration-200`}>
                                <Icon className="text-white text-xl sm:text-2xl" />
                                {action.ping && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-ping" />
                                )}
                                {action.badge && (
                                    <span className="absolute -top-1.5 -right-1.5 text-sm leading-none">{action.badge}</span>
                                )}
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-black text-gray-800 leading-tight group-hover:text-indigo-600 transition-colors">{action.label}</p>
                                <p className="text-[9px] text-gray-400 font-medium leading-tight mt-0.5 hidden sm:block">{action.sublabel}</p>
                            </div>
                        </Link>
                    </motion.div>
                )
            })}
        </div>
    )
}
