'use client'

import Link from 'next/link'
import { Button } from './Button'

import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'

import { FaUserCircle, FaCrown } from 'react-icons/fa'
import { UserBadge } from '@/components/shared/UserBadge'
import { useState, useEffect } from 'react'
import { SidebarDrawer } from './SidebarDrawer'

// Header Component
export const Header = () => {
    const { user, userProfile, isInTrial, loading } = useAuth()

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <>
            <SidebarDrawer isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-pw-border shadow-pw-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Hamburger Menu (Mobile Only) */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-pw-violet hover:bg-pw-surface rounded-lg transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 relative rounded-xl overflow-hidden shadow-pw-md">
                                <img
                                    src="/padhaku-192.png"
                                    alt="Padhaku Logo"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="font-display font-bold text-lg sm:text-xl text-pw-violet tracking-tight">
                                Padhaku
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Theme & Sound Toggles Removed as per request */}

                        {(!mounted || loading) ? (
                            <div className="w-24 h-9 bg-gray-100/50 rounded-full animate-pulse" />
                        ) : user ? (
                            <>
                                {userProfile?.subscription?.plan !== 'pro' && (
                                    isInTrial ? (
                                        <Link href="/pro">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md hover:shadow-lg transition-all border border-white/20"
                                            >
                                                <FaCrown className="text-sm" />
                                                <span className="text-xs font-bold whitespace-nowrap">
                                                    Trial: {(() => {
                                                        // Robust Time Calculation
                                                        const c = userProfile?.createdAt as any;
                                                        const createdMs = typeof c === 'number' ? c : (c?.toMillis ? c.toMillis() : new Date(c || 0).getTime());
                                                        const diffMs = Date.now() - createdMs;
                                                        const daysLeft = 7 - (diffMs / (24 * 60 * 60 * 1000));
                                                        return Math.ceil(daysLeft);
                                                    })()}d Left
                                                </span>
                                            </motion.button>
                                        </Link>
                                    ) : (
                                        <Link href="/pro">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md hover:shadow-lg transition-all border border-white/20"
                                            >
                                                <FaCrown className="text-sm" />
                                                <span className="text-xs font-bold whitespace-nowrap">Try Pro</span>
                                            </motion.button>
                                        </Link>
                                    )
                                )}

                                <Link href="/profile">
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="relative flex items-center gap-2 px-1.5 py-1 md:px-3 md:py-1.5 rounded-full bg-pw-surface hover:bg-pw-lavender/20 border border-pw-border transition-all cursor-pointer"
                                    >
                                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-pw-indigo to-pw-violet text-white flex items-center justify-center text-xs md:text-sm font-bold shadow-pw-sm">
                                            {user.email?.[0].toUpperCase() || <FaUserCircle />}
                                        </div>
                                        <UserBadge size="sm" className="-bottom-1 -right-1 border-white" userProfile={userProfile} showDefault={true} />
                                    </motion.div>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href="/login">
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="relative flex items-center gap-2 px-1.5 py-1 md:px-3 md:py-1.5 rounded-full bg-pw-surface hover:bg-pw-lavender/20 border border-pw-border transition-all cursor-pointer"
                                    >
                                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-100 text-pw-violet flex items-center justify-center text-xs md:text-sm font-bold shadow-pw-sm">
                                            <FaUserCircle />
                                        </div>
                                        <span className="text-xs font-bold text-pw-indigo hidden sm:block">Future Scholar</span>
                                    </motion.div>
                                </Link>
                                <Link href="/login">
                                    <Button size="sm" className="bg-pw-indigo hover:bg-pw-violet text-white border-0 shadow-pw-md text-xs md:text-sm px-3 md:px-4">Get Started</Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div >
            </header >
        </>
    )
}
