'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/shared/Button'
import { Timer } from '@/components/shared/Timer'
import { OptionButton } from '@/components/quiz/OptionButton'
import { mockQuestions } from '@/data/mock'
import { FaPause, FaTrophy, FaFire, FaUsers } from 'react-icons/fa'

export default function LiveBattlePage() {
    const router = useRouter()
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const question = mockQuestions[currentQuestionIndex]

    // Simulated Live Data
    const [rank, setRank] = useState(4)
    const [points, setPoints] = useState(1240)

    return (
        <div className="min-h-screen bg-surface-off pb-20">
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-surface-off shadow-sm">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded flex items-center gap-1 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-red-600"></span> LIVE
                        </div>
                        <div className="h-6 w-[1px] bg-slate-200"></div>
                        <div className="flex items-center gap-1 text-xs text-text-muted">
                            <FaUsers className="text-sm" /> 42
                        </div>
                    </div>

                    <Timer duration={30} onTimeUp={() => { }} />

                    <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                        <FaPause />
                    </button>
                </div>
                {/* Battle Progress - Faster/Intense */}
                <motion.div
                    className="h-1 bg-gradient-to-r from-brand-500 to-accent-500"
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 30, ease: 'linear' }}
                />
            </header>

            <main className="pt-24 px-4 max-w-2xl mx-auto">
                {/* Live Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl p-4 text-white flex items-center justify-between shadow-lg">
                        <div>
                            <p className="text-xs text-brand-100 font-bold uppercase">Your Rank</p>
                            <p className="text-3xl font-bold">#{rank}</p>
                        </div>
                        <FaTrophy className="text-3xl text-brand-300 opacity-50" />
                    </div>
                    <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-surface-off shadow-sm">
                        <div>
                            <p className="text-xs text-text-muted font-bold uppercase">Points</p>
                            <p className="text-3xl font-bold text-accent-500">{points}</p>
                        </div>
                        <FaFire className="text-3xl text-orange-200" />
                    </div>
                </div>

                {/* Question Area */}
                <motion.div
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <div className="bg-white rounded-3xl p-6 shadow-card mb-6">
                        <h2 className="text-xl font-bold text-text-main leading-relaxed">
                            {question.question}
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {question.options.map((opt, i) => (
                            <OptionButton
                                key={i}
                                label={String.fromCharCode(65 + i)}
                                optionText={opt}
                                onClick={() => { }} // In real app, submit socket event
                            />
                        ))}
                    </div>
                </motion.div>

                {/* Live Feed simulated */}
                <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-black/70 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full"
                    >
                        Rahul joined the battle 🚀
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 }}
                        className="bg-green-500/90 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full"
                    >
                        Priya solved it! 🔥
                    </motion.div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-surface-off backdrop-blur z-50">
                    <div className="max-w-2xl mx-auto">
                        <Button
                            fullWidth
                            size="xl"
                            className="animate-pulse bg-gradient-to-r from-red-500 to-orange-500 shadow-orange-500/30"
                        >
                            LOCK ANSWER
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    )
}
