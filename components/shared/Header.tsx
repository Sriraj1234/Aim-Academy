'use client'

import Link from 'next/link'
import { Button } from './Button'

import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'

import { FaUserCircle, FaCrown, FaGift, FaCopy, FaCheck, FaWhatsapp, FaTelegram, FaTimes } from 'react-icons/fa'
import { UserBadge } from '@/components/shared/UserBadge'
import { useState, useEffect } from 'react'
import { SidebarDrawer } from './SidebarDrawer'

export const Header = () => {
    const { user, userProfile, isInTrial } = useAuth()

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isReferralOpen, setIsReferralOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <>
            <SidebarDrawer isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-pw-border shadow-pw-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Logo acts as Menu Trigger */}
                    <div
                        onClick={() => setIsSidebarOpen(true)}
                        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    >
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
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Theme & Sound Toggles Removed as per request */}

                        {mounted && user ? (
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
                                                    Trial: {Math.ceil((7 * 24 * 60 * 60 * 1000 - (Date.now() - (userProfile?.createdAt || 0))) / (24 * 60 * 60 * 1000))}d Left
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
                                        className="relative flex items-center gap-2 px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-pw-surface hover:bg-pw-lavender/20 border border-pw-border transition-all cursor-pointer"
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
                                <Link href="/login" className="hidden sm:block">
                                    <Button variant="ghost" size="sm" className="text-pw-violet hover:bg-pw-lavender/20">Login</Button>
                                </Link>
                                <Link href="/login">
                                    <Button size="sm" className="bg-pw-indigo hover:bg-pw-violet text-white border-0 shadow-pw-md text-xs md:text-sm px-3 md:px-4">Get Started</Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Referral Modal */}
            {isReferralOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
                    onClick={() => setIsReferralOpen(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-pw-violet flex items-center gap-2">
                                <FaGift className="text-amber-500" /> Refer & Earn
                            </h3>
                            <button
                                onClick={() => setIsReferralOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <FaTimes className="text-gray-500" />
                            </button>
                        </div>

                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4">
                            <p className="text-sm text-gray-600 mb-2">🎁 Apne dost ko invite karo aur dono ko milega:</p>
                            <div className="flex justify-around text-center">
                                <div>
                                    <p className="font-bold text-2xl text-amber-600">50 XP</p>
                                    <p className="text-xs text-gray-500">Aapko</p>
                                </div>
                                <div className="w-px bg-amber-200"></div>
                                <div>
                                    <p className="font-bold text-2xl text-green-600">🎉 Bonus</p>
                                    <p className="text-xs text-gray-500">Dost ko</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-2">Tumhara Referral Link:</p>
                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-3 border">
                                <input
                                    type="text"
                                    readOnly
                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${user?.uid || ''}`}
                                    className="flex-1 bg-transparent text-sm text-gray-700 outline-none truncate"
                                />
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}?ref=${user?.uid || ''}`);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-500 text-white' : 'bg-pw-violet text-white hover:bg-pw-indigo'}`}
                                >
                                    {copied ? <FaCheck /> : <FaCopy />}
                                </button>
                            </div>
                            {copied && <p className="text-green-600 text-xs mt-1">✓ Link copied!</p>}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    const msg = `🎯 Padhaku par padho aur top karo! Mere saath join karo aur special bonus pao! 🎁\n\n${window.location.origin}?ref=${user?.uid || ''}`;
                                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                                }}
                                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                            >
                                <FaWhatsapp className="text-xl" /> WhatsApp
                            </button>
                            <button
                                onClick={() => {
                                    const msg = `🎯 Padhaku par padho aur top karo! Mere saath join karo aur special bonus pao! 🎁\n\n${window.location.origin}?ref=${user?.uid || ''}`;
                                    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin + '?ref=' + (user?.uid || ''))}&text=${encodeURIComponent(msg)}`, '_blank');
                                }}
                                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                            >
                                <FaTelegram className="text-xl" /> Telegram
                            </button>
                        </div>

                        {userProfile?.referralCount !== undefined && userProfile.referralCount > 0 && (
                            <div className="mt-4 text-center p-3 bg-purple-50 rounded-xl border border-purple-200">
                                <p className="text-sm text-gray-600">
                                    🏆 Tumne <span className="font-bold text-pw-violet">{userProfile.referralCount}</span> dost invite kiye!
                                </p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </>
    )
}
