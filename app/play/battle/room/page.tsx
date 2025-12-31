'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Header } from '@/components/shared/Header'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { FaGraduationCap, FaFlask, FaAtom, FaDna, FaGlobe } from 'react-icons/fa'

export default function CreateRoomPage() {
    const [selectedSubject, setSelectedSubject] = useState('math')

    const subjects = [
        { id: 'math', icon: <FaGraduationCap />, name: 'Math', color: 'bg-blue-500' },
        { id: 'physics', icon: <FaAtom />, name: 'Physics', color: 'bg-indigo-500' },
        { id: 'chemistry', icon: <FaFlask />, name: 'Chem', color: 'bg-purple-500' },
        { id: 'biology', icon: <FaDna />, name: 'Bio', color: 'bg-green-500' },
    ]

    return (
        <div className="min-h-screen bg-surface-off pb-20">
            <Header />

            <main className="pt-24 px-4 max-w-xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl p-6 text-white mb-8 shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <h1 className="text-2xl font-display font-bold mb-2">QUIZ ARENA</h1>
                            <p className="text-white/80 text-sm">Are you ready? 100% Adrenalin</p>
                        </div>
                        {/* Decorative circles */}
                        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    </div>

                    <div className="space-y-6">
                        {/* Subject Selection */}
                        <div>
                            <label className="text-sm font-bold text-text-sub mb-3 block">CHOOSE SUBJECT</label>
                            <div className="grid grid-cols-4 gap-3">
                                {subjects.map((sub) => (
                                    <button
                                        key={sub.id}
                                        onClick={() => setSelectedSubject(sub.id)}
                                        className={`
                              flex flex-col items-center gap-2 p-3 rounded-2xl transition-all
                              ${selectedSubject === sub.id ? 'bg-white shadow-soft ring-2 ring-brand-500 scale-105' : 'bg-surface-light border border-transparent hover:bg-white'}
                           `}
                                    >
                                        <div className={`w-10 h-10 rounded-full ${sub.color} text-white flex items-center justify-center text-lg`}>
                                            {sub.icon}
                                        </div>
                                        <span className={`text-xs font-bold ${selectedSubject === sub.id ? 'text-text-main' : 'text-text-muted'}`}>
                                            {sub.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Battle Config */}
                        <Card>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="font-bold text-text-main">Difficulty Level</label>
                                        <span className="text-brand-600 text-sm font-bold">Easy</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="w-1/3 h-full bg-brand-500 rounded-full"></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="font-bold text-text-main">Questions</label>
                                        <span className="text-brand-600 text-sm font-bold">10 Qs</span>
                                    </div>
                                    <input type="range" className="w-full accent-brand-500" />
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="font-bold text-text-main">Private Room</label>
                                    <div className="w-12 h-6 bg-brand-500 rounded-full p-1 cursor-pointer">
                                        <div className="w-4 h-4 bg-white rounded-full translate-x-6 shadow"></div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="pt-4">
                            <Link href="/play/battle/live">
                                <Button fullWidth size="lg" className="shadow-brand-500/30">
                                    Create Battle Room
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    )
}
