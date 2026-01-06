'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Batch } from '@/data/types';
import { Header } from '@/components/shared/Header';
import BatchCard from '@/components/batches/BatchCard';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function StorePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBatches = async () => {
            try {
                // Fetch all active and upcoming batches
                const q = query(
                    collection(db, 'batches'),
                    where('status', 'in', ['active', 'upcoming']),
                    // orderBy('createdAt', 'desc') // Requires index, avoiding for now to prevent errors
                );

                const snapshot = await getDocs(q);
                const batchData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Batch));
                setBatches(batchData);
            } catch (error) {
                console.error("Error fetching store batches:", error);
                toast.error("Failed to load courses");
            } finally {
                setLoading(false);
            }
        };

        fetchBatches();
    }, []);

    const handleEnroll = (batchId: string) => {
        if (!user) {
            toast.error("Please login to enroll");
            router.push('/login');
            return;
        }
        // Placeholder for payment/enrollment logic
        toast.success("Enrollment feature coming soon! Contact admin to join.");
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            <Header />

            <main className="pt-24 container mx-auto px-4 py-8">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Courses</h1>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        Join our premium batches to accelerate your learning. Get access to live classes, recorded lectures, and study materials.
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-80 bg-white rounded-xl shadow-sm animate-pulse border border-gray-200">
                                <div className="h-40 bg-gray-200 rounded-t-xl" />
                                <div className="p-5 space-y-3">
                                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                                    <div className="h-4 bg-gray-200 rounded w-full" />
                                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : batches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {batches.map(batch => (
                            <BatchCard
                                key={batch.id}
                                batch={batch}
                                actionButton={
                                    <button
                                        onClick={() => handleEnroll(batch.id)}
                                        className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                                    >
                                        Enroll Now
                                    </button>
                                }
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🎓</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">No Courses Available</h2>
                        <p className="text-gray-500 mt-2">Check back later for new batches.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
