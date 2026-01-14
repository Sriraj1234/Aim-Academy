'use client'

import React from 'react'
import Link from 'next/link'
import { HiCloudUpload, HiChartPie, HiDocumentText, HiLightningBolt, HiDuplicate } from 'react-icons/hi'

export default function AdminDashboard() {
    return (
        <div className="min-h-screen bg-pw-surface p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-display font-bold text-pw-violet mb-1">Admin Dashboard</h1>
                    <p className="text-gray-500 font-medium">Welcome back, Admin. Manage your question bank and content.</p>
                </div>

                {/* Quick Stats (Placeholder) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-[2rem] shadow-pw-md border border-pw-border flex items-center gap-4 hover:shadow-pw-lg transition-all">
                        <div className="w-14 h-14 rounded-2xl bg-pw-indigo/10 flex items-center justify-center text-pw-indigo shadow-sm">
                            <HiDocumentText className="text-2xl" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Questions</p>
                            <p className="text-3xl font-bold text-pw-violet">--</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] shadow-pw-md border border-pw-border flex items-center gap-4 hover:shadow-pw-lg transition-all">
                        <div className="w-14 h-14 rounded-2xl bg-pw-violet/10 flex items-center justify-center text-pw-violet shadow-sm">
                            <HiLightningBolt className="text-2xl" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Users</p>
                            <p className="text-3xl font-bold text-pw-violet">--</p>
                        </div>
                    </div>
                </div>

                {/* Action Cards */}
                <h2 className="text-xl font-bold text-pw-violet mb-6 flex items-center gap-2">
                    <span className="w-2 h-8 rounded-full bg-pw-indigo"></span>
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Upload Card */}
                    <Link href="/admin/upload" className="group">
                        <div className="bg-gradient-to-br from-pw-indigo to-pw-violet p-8 rounded-[2rem] text-white shadow-pw-lg border border-transparent hover:border-pw-indigo/30 transition-all hover:-translate-y-1 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>

                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md shadow-inner">
                                <HiCloudUpload className="text-3xl text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Upload Questions</h3>
                            <p className="text-indigo-100 text-sm font-medium leading-relaxed opacity-90">
                                Bulk upload questions via CSV/Excel. Auto-tagging support included.
                            </p>
                        </div>
                    </Link>

                    {/* Manage Users Card */}
                    <Link href="/admin/users" className="group">
                        <div className="bg-white p-8 rounded-[2rem] shadow-pw-lg border border-pw-border hover:border-pw-indigo/30 transition-all hover:-translate-y-1 group-hover:shadow-pw-xl relative overflow-hidden">
                            <div className="absolute right-0 bottom-0 w-32 h-32 bg-teal-50 rounded-full blur-2xl -mr-8 -mb-8"></div>

                            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-teal-100 transition-colors">
                                <span className="text-3xl">👥</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-teal-600 transition-colors">Manage Users</h3>
                            <p className="text-gray-500 text-sm font-medium leading-relaxed">
                                Search for users and manually grant Pro access.
                            </p>
                        </div>
                    </Link>

                    {/* Manage Questions Card */}
                    <Link href="/admin/questions" className="group">
                        <div className="bg-white p-8 rounded-[2rem] shadow-pw-lg border border-pw-border hover:border-pw-indigo/30 transition-all hover:-translate-y-1 group-hover:shadow-pw-xl relative overflow-hidden">
                            <div className="absolute right-0 bottom-0 w-32 h-32 bg-pw-indigo/5 rounded-full blur-2xl -mr-8 -mb-8"></div>

                            <div className="w-16 h-16 bg-pw-surface rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-pw-indigo/10 transition-colors">
                                <HiDocumentText className="text-3xl text-pw-indigo" />
                            </div>
                            <h3 className="text-2xl font-bold text-pw-violet mb-2 group-hover:text-pw-indigo transition-colors">Manage Questions</h3>
                            <p className="text-gray-500 text-sm font-medium leading-relaxed">
                                View, edit, and delete existing questions. Advanced filtering options.
                            </p>
                        </div>
                    </Link>

                    {/* Manage Tuitions Card */}
                    <Link href="/admin/tuitions" className="group">
                        <div className="bg-white p-8 rounded-[2rem] shadow-pw-lg border border-pw-border hover:border-pink-200 transition-all hover:-translate-y-1 group-hover:shadow-pw-xl relative overflow-hidden">
                            <div className="absolute right-0 bottom-0 w-32 h-32 bg-pink-50 rounded-full blur-2xl -mr-8 -mb-8"></div>

                            <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-pink-100 transition-colors">
                                <span className="text-3xl">🏠</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-pink-600 transition-colors">Manage Tuitions</h3>
                            <p className="text-gray-500 text-sm font-medium leading-relaxed">
                                Verify, edit, and delete offline tuition listings.
                            </p>
                        </div>
                    </Link>

                    {/* Live Quizzes Card */}
                    <Link href="/admin/live-quizzes" className="group">
                        <div className="bg-white p-8 rounded-[2rem] shadow-pw-lg border border-pw-border hover:border-red-200 transition-all hover:-translate-y-1 group-hover:shadow-pw-xl relative overflow-hidden">
                            <div className="absolute right-0 bottom-0 w-32 h-32 bg-red-50 rounded-full blur-2xl -mr-8 -mb-8"></div>

                            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-red-100 transition-colors">
                                <span className="text-3xl">⏰</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-red-600 transition-colors">Live Quizzes</h3>
                            <p className="text-gray-500 text-sm font-medium leading-relaxed">
                                Schedule and manage real-time global quizzes.
                            </p>
                        </div>
                    </Link>

                    {/* Manage Duplicates Card */}
                    <Link href="/admin/duplicates" className="group">
                        <div className="bg-white p-8 rounded-[2rem] shadow-pw-lg border border-pw-border hover:border-orange-200 transition-all hover:-translate-y-1 group-hover:shadow-pw-xl relative overflow-hidden">
                            <div className="absolute right-0 bottom-0 w-32 h-32 bg-orange-50 rounded-full blur-2xl -mr-8 -mb-8"></div>

                            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-orange-100 transition-colors">
                                <HiDuplicate className="text-3xl text-orange-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors">Manage Duplicates</h3>
                            <p className="text-gray-500 text-sm font-medium leading-relaxed">
                                Scan database to identify and resolve duplicate question entries.
                            </p>
                        </div>
                    </Link>

                    {/* Coming Soon Cards */}
                    <div className="bg-white p-8 rounded-[2rem] border border-pw-border opacity-60 hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
                            <HiChartPie className="text-3xl text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-gray-400">Analytics</h3>
                        <p className="text-gray-400 text-sm font-medium">
                            Detailed usage reports and insights (Coming Soon).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
