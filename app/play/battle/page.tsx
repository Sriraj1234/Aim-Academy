'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Header } from '@/components/shared/Header'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { FaGamepad, FaUsers, FaHashtag } from 'react-icons/fa'

export default function BattleLobbyPage() {
    return (
        <div className="min-h-screen bg-surface-off">
            <Header />

            <main className="pt-24 px-4 max-w-lg mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="w-32 h-32 mx-auto mb-8 bg-brand-100 rounded-full flex items-center justify-center relative">
                        <FaGamepad className="text-6xl text-brand-600" />
                        <div className="absolute -top-2 -right-2 w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center text-white border-4 border-surface-off">
                            <FaUsers />
                        </div>
                    </div>

                    <h1 className="text-4xl font-display font-bold text-text-main mb-4">
                        Ready to <span className="text-brand-600">Battle?</span>
                    </h1>
                    <p className="text-text-sub mb-8">
                        Compete with friends or random players in real-time.
                    </p>

                    <div className="bg-white p-6 rounded-3xl shadow-card space-y-6 mb-6">
                        <Input
                            placeholder="Enter Room Code"
                            icon={<FaHashtag className="text-lg" />}
                            className="text-center font-display font-bold text-xl tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
                        />
                        <Link href="/play/battle/live" className="block">
                            <Button fullWidth size="lg" className="shadow-brand-500/20">
                                JOIN BATTLE
                            </Button>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4 justify-center text-sm text-text-muted mb-6">
                        <div className="h-[1px] bg-slate-200 w-16"></div>
                        OR
                        <div className="h-[1px] bg-slate-200 w-16"></div>
                    </div>

                    <Link href="/play/battle/room">
                        <Button variant="outline" fullWidth size="lg">
                            CREATE ROOM
                        </Button>
                    </Link>
                </motion.div>
            </main>
        </div>
    )
}
