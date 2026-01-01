'use client';

import { useState } from 'react';
import { Header } from '@/components/shared/Header';
import { FaFilePdf, FaFlask, FaProjectDiagram, FaBookOpen } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'formulas' | 'mindmaps' | 'notes';

export default function NotesPage() {
    const [activeTab, setActiveTab] = useState<TabType>('notes');

    // Mock Data (Replace with Firestore later)
    const resources = {
        formulas: [
            { id: 1, title: 'Physics Chapter 1 Formulas', size: '1.2 MB', date: '2 days ago', url: '#' },
            { id: 2, title: 'Integration Cheat Sheet', size: '800 KB', date: '1 week ago', url: '#' },
        ],
        mindmaps: [
            { id: 3, title: 'Organic Chemistry Roadmap', size: '2.5 MB', date: '3 days ago', url: '#' },
            { id: 4, title: 'Indian History Timeline', size: '1.8 MB', date: 'Yesterday', url: '#' },
        ],
        notes: [
            { id: 5, title: 'Electrostatics Full Notes', size: '5.0 MB', date: 'Just now', url: '#' },
            { id: 6, title: 'Biology - Genetics', size: '3.2 MB', date: '1 month ago', url: '#' },
        ]
    };

    const tabs = [
        { id: 'notes', label: 'Chapter Notes', icon: FaBookOpen, color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 'formulas', label: 'Formula Sheets', icon: FaFlask, color: 'text-purple-500', bg: 'bg-purple-50' },
        { id: 'mindmaps', label: 'Mind Maps', icon: FaProjectDiagram, color: 'text-pink-500', bg: 'bg-pink-50' },
    ] as const;

    return (
        <div className="min-h-screen bg-pw-surface pb-20 font-sans">
            <Header />
            <main className="pt-24 px-4 max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-display font-bold text-pw-violet mb-2">Study Resources</h1>
                    <p className="text-gray-500">Access your organized library of PDFs and materials.</p>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-pw-border overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all font-bold whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-pw-indigo text-white shadow-md'
                                : 'hover:bg-pw-surface text-gray-500'
                                }`}
                        >
                            <tab.icon className={activeTab === tab.id ? 'text-white' : tab.color} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="wait">
                        {resources[activeTab].map((item, index) => (
                            <motion.div
                                key={item.id}
                                onClick={() => {
                                    if ((item as any).url) {
                                        if ((item as any).url === '#') {
                                            alert("This is a sample file. Real files will open directly once uploaded!");
                                        } else {
                                            window.open((item as any).url, '_blank');
                                        }
                                    }
                                }}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white p-5 rounded-2xl border border-pw-border hover:shadow-pw-md transition-all group cursor-pointer relative overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:scale-150 transition-transform duration-500 ${activeTab === 'formulas' ? 'text-purple-500' : activeTab === 'mindmaps' ? 'text-pink-500' : 'text-blue-500'
                                    }`}>
                                    <FaFilePdf size={60} />
                                </div>

                                <div className="flex items-start justify-between relative z-10">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${activeTab === 'formulas' ? 'bg-purple-100/50 text-purple-600' : activeTab === 'mindmaps' ? 'bg-pink-100/50 text-pink-600' : 'bg-blue-100/50 text-blue-600'
                                        }`}>
                                        <FaFilePdf className="text-xl" />
                                    </div>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                                        PDF
                                    </span>
                                </div>

                                <h3 className="font-bold text-gray-800 mb-1 group-hover:text-pw-indigo transition-colors line-clamp-1">{item.title}</h3>
                                <div className="flex items-center text-xs text-gray-500 gap-3">
                                    <span>{item.size}</span>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    <span>{item.date}</span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {resources[activeTab].length === 0 && (
                    <div className="text-center py-20 text-gray-400">
                        <p>No resources found in this category yet.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
