'use client'

import { useState, useEffect } from 'react';
import { Header } from '@/components/shared/Header';
import { useAuth } from '@/context/AuthContext';
import { Batch } from '@/data/types';
import Link from 'next/link';
import { FaLock, FaExternalLinkAlt } from 'react-icons/fa';
import { db } from '@/lib/firebase';
import { documentId, collection, query, where, getDocs } from 'firebase/firestore';
import BatchCard from '@/components/batches/BatchCard';
import { toast } from 'react-hot-toast';

export default function BatchesPage() {
    const { userProfile, loading: authLoading } = useAuth();
    const [myBatches, setMyBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyBatches = async () => {
            if (authLoading) return;

            const enrolledIds = userProfile?.enrolledBatches || [];

            if (enrolledIds.length === 0) {
                setMyBatches([]);
                setLoading(false);
                return;
            }

            try {
                // Firestore 'in' query supports up to 10 items. 
                // For production with >10, we'd need to chunk this request.
                // Assuming < 10 for now.
                const q = query(
                    collection(db, 'batches'),
                    where(documentId(), 'in', enrolledIds)
                );

                const snapshot = await getDocs(q);
                const batchData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Batch));
                setMyBatches(batchData);
            } catch (error) {
                console.error("Error fetching my batches:", error);
                toast.error("Failed to load your batches");
            } finally {
                setLoading(false);
            }
        };

        fetchMyBatches();
    }, [userProfile, authLoading]);

    if (authLoading || (loading && userProfile?.enrolledBatches?.length)) {
        return (
            <div className="min-h-screen bg-gray-50 pt-24 pb-20 container mx-auto px-4">
                <Header />
                <div className="flex justify-between items-center mb-6">
                    <div className="h-8 bg-gray-200 rounded w-40 animate-pulse" />
                </div>
                <div className="grid gap-6">
                    {[1, 2].map(i => (
                        <div key={i} className="h-48 bg-white rounded-xl shadow-sm animate-pulse border border-gray-200" />
                    ))}
                </div>
            </div>
        );
    }

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myBatches.map(batch => (
                            <BatchCard
                                key={batch.id}
                                batch={batch}
                                actionButton={
                                    <Link href={`/batches/${batch.id}`} className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 whitespace-nowrap block text-center">
                                        View Classes
                                    </Link>
                                }
                            />
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
