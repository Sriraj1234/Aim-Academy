'use client'

import Link from 'next/link'
import { Button } from './Button'

import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'

import { FaUserCircle } from 'react-icons/fa'

export const Header = () => {
    const { user } = useAuth()

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-pw-border shadow-pw-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-9 h-9 relative rounded-xl overflow-hidden shadow-pw-md">
                        <img
                            src="/padhaku-192.png"
                            alt="Padhaku Logo"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className="font-display font-bold text-xl text-pw-violet tracking-tight">
                        Padhaku
                    </span>
                </Link>

                <div className="flex items-center gap-2 md:gap-3">
                    {/* Theme & Sound Toggles Removed as per request */}

                    {user ? (
                        <Link href="/profile">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-pw-surface hover:bg-pw-lavender/20 border border-pw-border transition-all cursor-pointer"
                            >
                                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-pw-indigo to-pw-violet text-white flex items-center justify-center text-xs md:text-sm font-bold shadow-pw-sm">
                                    {user.email?.[0].toUpperCase() || <FaUserCircle />}
                                </div>
                            </motion.div>
                        </Link>
                    ) : (
                        <>
                            <Link href="/login" className="hidden sm:block">
                                <Button variant="ghost" size="sm" className="text-pw-violet hover:bg-pw-lavender/20">Login</Button>
                            </Link>
                            <Link href="/onboarding">
                                <Button size="sm" className="bg-pw-indigo hover:bg-pw-violet text-white border-0 shadow-pw-md text-xs md:text-sm px-3 md:px-4">Get Started</Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}
