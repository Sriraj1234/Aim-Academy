'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaAtom, FaDna, FaCalculator, FaMicroscope, FaGlobeAmericas, FaLandmark, FaArrowLeft } from 'react-icons/fa';

export default function AIVivaSelectionPage() {
    // Mock Data for MVP - In real app, fetch from metadata/taxonomy
    const subjects = [
        {
            id: 'science',
            name: 'Science',
            icon: FaAtom,
            color: 'bg-blue-500',
            chapters: [
                'Chemical Reactions', 'Acids Bases Salts', 'Metals Non-Metals',
                'Life Processes', 'Control Coordination', 'Light Reflection', 'Electricity'
            ]
        },
        {
            id: 'social',
            name: 'Social Science',
            icon: FaGlobeAmericas,
            color: 'bg-green-500',
            chapters: [
                'Rise of Nationalism', 'Resources and Development', 'Power Sharing', 'Federalism'
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-24">
            <header className="max-w-4xl mx-auto mb-8 flex items-center gap-4">
                <Link href="/play" className="p-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-gray-500 hover:text-gray-800">
                    <FaArrowLeft />
                </Link>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">AI Viva Room 🎙️</h1>
                    <p className="text-gray-500">Pick a chapter to start your oral exam simulation.</p>
                </div>
            </header>

            <div className="max-w-4xl mx-auto space-y-8">
                {subjects.map((subject) => (
                    <div key={subject.id}>
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <subject.icon className="text-purple-600" /> {subject.name}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {subject.chapters.map((chapter, idx) => (
                                <Link
                                    key={chapter}
                                    href={`/play/ai-viva/${subject.name}/${chapter}`}
                                    className="block"
                                >
                                    <motion.div
                                        whileHover={{ y: -5, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all cursor-pointer h-full flex flex-col justify-between group"
                                    >
                                        <h3 className="font-bold text-gray-700 group-hover:text-purple-700 transition-colors mb-2">
                                            {chapter}
                                        </h3>
                                        <div className="flex justify-between items-center text-xs font-medium text-gray-400 group-hover:text-purple-400">
                                            <span>Start Viva</span>
                                            <span className="w-6 h-6 rounded-full bg-gray-50 group-hover:bg-purple-100 flex items-center justify-center text-gray-400 group-hover:text-purple-600 transition-colors">
                                                🎤
                                            </span>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
