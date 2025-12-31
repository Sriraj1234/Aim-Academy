'use client'

import { motion, AnimatePresence } from 'framer-motion'

export const LiveLeaderboard = () => {
    // Simulated participants
    const participants = [
        { id: 1, bg: 'bg-red-200' },
        { id: 2, bg: 'bg-blue-200' },
        { id: 3, bg: 'bg-green-200' },
        { id: 4, bg: 'bg-yellow-200' },
    ]

    return (
        <div className="flex items-center gap-4 py-4 px-6 bg-surface-off/50 rounded-2xl glass border border-white/20">
            <div className="flex -space-x-3">
                {participants.map((p, i) => (
                    <div key={p.id} className={`w-8 h-8 rounded-full border-2 border-white ${p.bg}`} />
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white bg-surface-dark text-white flex items-center justify-center text-xs font-bold">
                    +12
                </div>
            </div>
        </div>
    )
}
