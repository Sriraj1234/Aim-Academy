'use client'

import { Header } from '@/components/shared/Header';
import { useAuth } from '@/context/AuthContext';
import { Batch } from '@/data/types';
import Link from 'next/link';
import { FaLock, FaExternalLinkAlt } from 'react-icons/fa';

// Mock Database of All Batches
const ALL_BATCHES: Batch[] = [
    {
        id: 'batch_12_science_pcm',
        name: 'Class 12 - Science (PCM)',
        description: 'Physics, Chemistry, Maths - Full Course for Board Exams.',
        subjects: ['Physics', 'Chemistry', 'Maths'],
        startDate: '2025-04-01',
        endDate: '2026-03-31',
        status: 'active',
        teacherIds: [],
        price: 4999
    },
    {
        id: 'batch_neet_crash_2025',
        name: 'NEET Crash Course 2025',
        description: 'Intensive revision for Biology, Physics, Chemistry.',
        subjects: ['Biology', 'Physics', 'Chemistry'],
        startDate: '2025-02-01',
        endDate: '2025-05-01',
        status: 'upcoming',
        teacherIds: [],
        price: 2999
    },
    {
        id: 'batch_10_foundation',
        name: 'Class 10 - Foundation',
        description: 'Strong foundation for Boards and future competitive exams.',
        subjects: ['Maths', 'Science', 'SST', 'English'],
        startDate: '2025-04-01',
        endDate: '2026-03-31',
        status: 'active',
        teacherIds: [],
        price: 3999
    }
];

export default function BatchesPage() {
    const { userProfile, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen bg-gray-50 pt-24 flex justify-center"><p className="text-gray-500">Loading batches...</p></div>;
    }

    // Filter Batches Logic
    // If user has no enrolledBatches array, enrolledCount is 0.
    const enrolledBatchIds = userProfile?.enrolledBatches || [];
    const myBatches = ALL_BATCHES.filter(batch => enrolledBatchIds.includes(batch.id));

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans selection:bg-purple-500 selection:text-white">
            <Header />

            <main className="pt-24 container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">My Batches</h1>
                    <Link href="/store" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                        Browse Store <FaExternalLinkAlt className="text-xs" />
                    </Link>
                </div>

                {myBatches.length > 0 ? (
                    <div className="grid gap-6">
                        {myBatches.map(batch => (
                            <div key={batch.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-2">{batch.name}</h2>
                                        <p className="text-gray-600 text-sm mb-4">{batch.description}</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${batch.status === 'active' ? 'bg-green-100 text-green-700' :
                                                    batch.status === 'upcoming' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {batch.status.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-gray-500">Subjects: {batch.subjects.join(', ')}</span>
                                        </div>
                                    </div>
                                    <button className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 whitespace-nowrap">
                                        View Classes
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300 text-center px-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <FaLock className="text-gray-400 text-2xl" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No Active Batches</h2>
                        <p className="text-gray-500 max-w-md mb-6">
                            You haven't enrolled in any batches yet. Purchase a course from the store to unlock live classes and contents.
                        </p>
                        <Link href="/store" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                            Explore Courses
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
