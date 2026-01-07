'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HiHome, HiUpload, HiDatabase, HiUsers, HiChartBar } from 'react-icons/hi'
import { FaYoutube, FaPuzzlePiece, FaBell, FaUserShield, FaChalkboardTeacher, FaClock } from 'react-icons/fa'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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

    useEffect(() => {
        if (!loading) {
            if (user?.email && AUTHORIZED_EMAILS.includes(user.email)) {
                setIsAuthorized(true);
            } else if (user?.email) {
                // Logged in but not authorized
                setIsAuthorized(false);
            } else {
                // Not logged in
                setIsAuthorized(false)
            }
        }
    }, [user, loading])

    const navItems = [
        { label: 'Dashboard', href: '/admin', icon: HiChartBar },
        { label: 'Super Admin', href: '/admin/super', icon: FaUserShield },
        { label: 'Upload Questions', href: '/admin/upload', icon: HiUpload },
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

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white hidden md:block border-r border-slate-800">
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                        AIM Admin
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">Control Center</p>
                </div>

                <nav className="mt-6 px-3">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${isActive
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <Icon className="text-xl" />
                                <span className="font-semibold text-sm">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="absolute bottom-0 w-64 p-4 border-t border-slate-800">
                    <Link href="/" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors">
                        <HiHome className="text-xl" />
                        <span className="font-semibold text-sm">Back to App</span>
                    </Link>
                </div>
            </aside>

            {/* Mobile Nav Overlay (Simple for now) */}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto h-screen">
                <header className="bg-white border-b border-slate-200 p-4 md:hidden flex justify-between items-center sticky top-0 z-10">
                    <span className="font-bold text-slate-800">AIM Admin</span>
                    <Link href="/" className="text-sm text-purple-600 font-semibold">Exit</Link>
                </header>

                <div className="p-0 md:p-2">
                    {children}
                </div>
            </main>
        </div>
    )
}
