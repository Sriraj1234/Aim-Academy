'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { FaChalkboardTeacher, FaPlus, FaLayerGroup, FaLock } from 'react-icons/fa';
import BatchForm from '@/components/teachers/BatchForm';
import { getBatchesByTeacher } from '@/utils/batchService';
import { Batch } from '@/data/types';
import { toast } from 'react-hot-toast';

export default function TeacherAdminPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [teacherProfile, setTeacherProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'batches'>('overview');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [myBatches, setMyBatches] = useState<Batch[]>([]);

    const fetchBatches = async (email: string) => {
        try {
            const batches = await getBatchesByTeacher(email);
            setMyBatches(batches);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load batches");
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            if (!user?.email) return;

            try {
                const docRef = doc(db, 'teachers', user.email);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().status === 'active') {
                    setIsAuthorized(true);
                    setTeacherProfile(docSnap.data());
                    fetchBatches(user.email);
                } else {
                    setIsAuthorized(false);
                }
            } catch (error) {
                console.error("Auth check failed", error);
                setIsAuthorized(false);
            }
        };

        if (user) checkAuth();
    }, [user]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Teacher Login Required</h2>
                    <p className="text-gray-500 mb-4">Please log in to access the dashboard.</p>
                </div>
            </div>
        );
    }

    if (isAuthorized === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-red-100 max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaLock className="text-red-500 text-2xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-6">
                        This area is restricted to authorized teachers only.
                        Please contact the administration if you believe this is an error.
                    </p>
                    <button onClick={() => router.push('/')} className="text-brand-600 font-medium hover:underline">
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    if (isAuthorized === null) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white">
                            <FaChalkboardTeacher size={20} />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 leading-tight">Teacher Dashboard</h1>
                            <p className="text-xs text-gray-500">Welcome, {teacherProfile?.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                    >
                        <FaPlus /> Create Batch
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Content Tabs */}
                <div className="mb-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('batches')}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'batches'
                                    ? 'border-brand-500 text-brand-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            My Batches ({myBatches.length})
                        </button>
                    </nav>
                </div>

                {/* Batches View */}
                {activeTab === 'batches' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Create Card */}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 hover:border-brand-500 hover:text-brand-500 hover:bg-brand-50 transition-all group min-h-[250px]"
                        >
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-white">
                                <FaPlus className="text-xl" />
                            </div>
                            <span className="font-bold">Launch New Batch</span>
                        </button>

                        {/* Batch Cards */}
                        {myBatches.map(batch => (
                            <div key={batch.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="h-32 bg-gray-200 relative">
                                    {batch.thumbnailUrl ? (
                                        <img src={batch.thumbnailUrl} alt={batch.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <FaLayerGroup size={32} />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm">
                                        {batch.status.toUpperCase()}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 mb-1">{batch.name}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{batch.description}</p>

                                    <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
                                        <span className="bg-gray-100 px-2 py-1 rounded">{batch.subjects.length} Subjects</span>
                                        <span className="font-bold text-brand-600">₹{batch.price}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Batch Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-800">Create New Batch</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <div className="p-6">
                            <BatchForm onSuccess={() => {
                                setShowCreateModal(false);
                                if (user?.email) fetchBatches(user.email);
                            }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
