'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { HiHome, HiUpload, HiUsers, HiChartBar, HiMenu, HiX } from 'react-icons/hi'
import { FaYoutube, FaPuzzlePiece, FaBell, FaUserShield, FaClock } from 'react-icons/fa'
import { AnimatePresence, motion } from 'framer-motion'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { FaLock } from 'react-icons/fa'

const AUTHORIZED_EMAILS = [
    'jayant.kgp81@gmail.com',
    'jayantkumar1985kh@gmail.com'
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const { user, loading } = useAuth()
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        if (!loading) {
            if (user?.email && AUTHORIZED_EMAILS.includes(user.email)) {
                setIsAuthorized(true);
            } else if (user?.email) {
                setIsAuthorized(false);
            } else {
                setIsAuthorized(false)
            }
        }
    }, [user, loading])

    const navItems = [
        { label: 'Dashboard', href: '/admin', icon: HiChartBar },
        { label: 'Super Admin', href: '/admin/super', icon: FaUserShield },
        { label: 'Upload Questions', href: '/admin/upload', icon: HiUpload },
        { label: 'User Management', href: '/admin/users', icon: HiUsers },
        { label: 'Live Quiz Manager', href: '/admin/live-quizzes', icon: FaClock },
        { label: 'Study Hub Manager', href: '/admin/study-hub', icon: FaYoutube },
        { label: 'Mind Game Manager', href: '/admin/mind-game', icon: FaPuzzlePiece },
        { label: 'Notification Manager', href: '/admin/notifications', icon: FaBell },
    ]

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaLock className="text-indigo-600 text-2xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
                    <p className="text-gray-500 mb-6">Please log in with an authorized administrative account to access this panel.</p>
                    <Link href="/" className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                        Return Home
                    </Link>
                </div>
            </div>
        )
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaUserShield className="text-red-600 text-2xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-500 mb-4">You are not authorized to access the Admin Panel.</p>
                    <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded mb-6 font-mono">
                        {user.email} is not in the whitelist.
                    </p>
                    <Link href="/" className="inline-block bg-white text-gray-700 border border-gray-300 px-6 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors">
                        Back to App
                    </Link>
                </div>
            </div>
        )
    }

    const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
        <>
            {/* Logo Section */}
            <div className="p-5 border-b border-slate-800">
                <Link href="/" onClick={onLinkClick} className="flex items-center gap-3 group">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white/10 flex-shrink-0 shadow-lg">
                        <Image
                            src="/padhaku-192.png"
                            alt="Padhaku Logo"
                            width={40}
                            height={40}
                            className="object-cover"
                        />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white leading-tight">Padhaku</h1>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Admin Panel</p>
                    </div>
                </Link>
            </div>

            <nav className="flex-1 px-3 py-4 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onLinkClick}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${isActive
                                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-900/10'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <Icon className="text-xl flex-shrink-0" />
                            <span className="font-semibold text-sm">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <Link href="/" onClick={onLinkClick} className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                    <HiHome className="text-xl" />
                    <span className="font-semibold text-sm">Back to App</span>
                </Link>
            </div>
        </>
    )

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Desktop Sidebar */}
            <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col border-r border-slate-800 sticky top-0 h-screen overflow-y-auto">
                <SidebarContent />
            </aside>

            {/* Mobile Nav Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                            className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-white z-50 md:hidden flex flex-col shadow-2xl"
                        >
                            <div className="p-4 flex justify-between items-center border-b border-slate-800">
                                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3">
                                    <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                                        <Image src="/padhaku-192.png" alt="Padhaku" width={36} height={36} className="object-cover" />
                                    </div>
                                    <div>
                                        <h1 className="text-base font-bold text-white leading-tight">Padhaku</h1>
                                        <p className="text-[10px] text-slate-400">Admin Panel</p>
                                    </div>
                                </Link>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
                                    <HiX className="text-xl" />
                                </button>
                            </div>
                            <SidebarContent onLinkClick={() => setIsMobileMenuOpen(false)} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
                <header className="bg-white border-b border-slate-200 px-4 py-3 md:hidden flex justify-between items-center sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
                        >
                            <HiMenu className="text-2xl" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="relative w-7 h-7 rounded-lg overflow-hidden">
                                <Image src="/padhaku-192.png" alt="Padhaku" width={28} height={28} className="object-cover" />
                            </div>
                            <span className="font-bold text-slate-800">Admin Dashboard</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
