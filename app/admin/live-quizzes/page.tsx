'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { LiveQuiz } from '@/data/types';
import Link from 'next/link';
import { FaPlus, FaTrash, FaCalendarAlt, FaClock, FaUsers, FaGlobe, FaChalkboardTeacher } from 'react-icons/fa';
import { HiArrowLeft } from 'react-icons/hi';

export default function LiveQuizAdminPage() {
    const [quizzes, setQuizzes] = useState<LiveQuiz[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'live_quizzes'), orderBy('startTime', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveQuiz));
            setQuizzes(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this live quiz?')) return;
        try {
            await deleteDoc(doc(db, 'live_quizzes', id));
        } catch (error) {
            console.error("Error deleting quiz:", error);
            alert("Failed to delete quiz");
        }
    };

    const getStatusColor = (quiz: LiveQuiz) => {
        const now = Date.now();
        if (quiz.endTime < now) return 'bg-gray-100 text-gray-500 border-gray-200';
        if (quiz.startTime <= now && quiz.endTime > now) return 'bg-green-50 text-green-600 border-green-200 animate-pulse';
        return 'bg-blue-50 text-blue-600 border-blue-200';
    };

    const getStatusText = (quiz: LiveQuiz) => {
        const now = Date.now();
        if (quiz.endTime < now) return 'Ended';
        if (quiz.startTime <= now && quiz.endTime > now) return 'Live Now';
        return 'Scheduled';
    };

    return (
        <div className="min-h-screen bg-pw-surface p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <Link href="/admin" className="text-gray-400 font-bold hover:text-pw-indigo flex items-center gap-1 mb-2">
                            <HiArrowLeft /> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-display font-bold text-pw-violet">Live Quizzes</h1>
                        <p className="text-gray-500 font-medium">Manage global and batch-specific live events.</p>
                    </div>
                    <Link
                        href="/admin/live-quizzes/create"
                        className="flex items-center gap-2 bg-gradient-to-r from-pw-indigo to-pw-violet text-white px-6 py-3 rounded-xl font-bold shadow-pw-md hover:shadow-pw-lg transition-all hover:-translate-y-0.5"
                    >
                        <FaPlus /> Create Live Quiz
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin w-8 h-8 border-2 border-pw-indigo border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading quizzes...</p>
                    </div>
                ) : quizzes.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-[2rem]">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-4">
                            <FaCalendarAlt className="text-2xl" />
                        </div>
                        <p className="text-gray-400 font-bold mb-1">No live quizzes found</p>
                        <p className="text-gray-500 text-sm">Create a new quiz to get started.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {quizzes.map((quiz) => (
                            <div key={quiz.id} className="bg-white p-6 rounded-2xl border border-pw-border shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${getStatusColor(quiz)}`}>
                                            {getStatusText(quiz)}
                                        </span>
                                        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border flex items-center gap-1 ${quiz.type === 'global' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                            {quiz.type === 'global' ? <FaGlobe /> : <FaChalkboardTeacher />} {quiz.type}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-pw-violet mb-1">{quiz.title}</h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1"><FaCalendarAlt /> {new Date(quiz.startTime).toLocaleDateString()} {new Date(quiz.startTime).toLocaleTimeString()}</span>
                                        <span className="flex items-center gap-1"><FaClock /> {quiz.duration} mins</span>
                                        <span className="flex items-center gap-1"><FaUsers /> {quiz.participantsCount || 0} participants</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleDelete(quiz.id)}
                                        className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                        title="Delete Quiz"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
