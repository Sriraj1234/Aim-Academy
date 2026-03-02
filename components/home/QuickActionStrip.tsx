'use client'

import { motion } from 'framer-motion'
import { FaLayerGroup, FaUsers, FaBookOpen, FaBrain } from 'react-icons/fa'
import Link from 'next/link'

const ACTIONS = [
    {
        label: 'Practice',
        sublabel: 'Chapter MCQ',
        icon: FaLayerGroup,
        href: '/play/selection',
        gradient: 'from-indigo-500 to-violet-600',
        glow: 'shadow-indigo-200',
        ping: true,
        action: null,
    },
    {
        label: 'Play',
        sublabel: 'With Friends',
        icon: FaUsers,
        href: '/play/group',
        gradient: 'from-orange-500 to-red-500',
        glow: 'shadow-orange-200',
        ping: false,
        badge: '🔥',
        action: null,
    },
    {
        label: 'Study Hub',
        sublabel: 'Free Videos',
        icon: FaBookOpen,
        href: '/study-hub',
        gradient: 'from-emerald-500 to-teal-500',
        glow: 'shadow-emerald-200',
        ping: false,
        action: null,
    },
    {
        label: 'AI Tutor',
        sublabel: 'Ask Anything',
        icon: FaBrain,
        href: null, // No navigation — opens the AI Buddy widget in place
        gradient: 'from-purple-500 to-pink-500',
        glow: 'shadow-purple-200',
        ping: false,
        action: 'openAIBuddy', // Fires a custom window event
    },
]

export const QuickActionStrip = () => {
    const handleAction = (action: string | null) => {
        if (action === 'openAIBuddy') {
            window.dispatchEvent(new CustomEvent('openAIBuddy'));
        }
    }

    return (
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
            {ACTIONS.map((item, i) => {
                const Icon = item.icon
                const inner = (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07, type: 'spring', stiffness: 280 }}
                        className="flex flex-col items-center gap-2 group cursor-pointer"
                        onClick={() => item.action ? handleAction(item.action) : undefined}
                    >
                        <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg ${item.glow} group-hover:scale-110 group-active:scale-95 transition-transform duration-200`}>
                            <Icon className="text-white text-xl sm:text-2xl" />
                            {item.ping && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-ping" />
                            )}
                            {'badge' in item && item.badge && (
                                <span className="absolute -top-1.5 -right-1.5 text-sm leading-none">{item.badge}</span>
                            )}
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-black text-gray-800 leading-tight group-hover:text-indigo-600 transition-colors">{item.label}</p>
                            <p className="text-[9px] text-gray-400 font-medium leading-tight mt-0.5 hidden sm:block">{item.sublabel}</p>
                        </div>
                    </motion.div>
                )

                return item.href ? (
                    <Link key={item.label} href={item.href}>
                        {inner}
                    </Link>
                ) : (
                    <div key={item.label}>
                        {inner}
                    </div>
                )
            })}
        </div>
    )
}
