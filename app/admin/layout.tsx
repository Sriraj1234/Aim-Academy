'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HiHome, HiUpload, HiDatabase, HiUsers, HiChartBar } from 'react-icons/hi'
import { FaYoutube, FaPuzzlePiece } from 'react-icons/fa'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    const navItems = [
        { label: 'Dashboard', href: '/admin', icon: HiChartBar },
        { label: 'Upload Questions', href: '/admin/upload', icon: HiUpload },
        { label: 'Study Hub Manager', href: '/admin/study-hub', icon: FaYoutube },
        { label: 'Mind Game Manager', href: '/admin/mind-game', icon: FaPuzzlePiece },
        // { label: 'Manage Users', href: '/admin/users', icon: HiUsers }, // Future
        // { label: 'Metadata', href: '/admin/metadata', icon: HiDatabase }, // Future
    ]

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
