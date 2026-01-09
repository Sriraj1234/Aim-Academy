'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { LiveQuiz, LiveQuizResult } from '@/data/types';
import Link from 'next/link';
import { HiArrowLeft, HiDownload } from 'react-icons/hi';
import { FaTrophy, FaUsers, FaClock, FaChartLine, FaMedal } from 'react-icons/fa';

export default function QuizResultsPage() {
    const { quizId } = useParams();
    const router = useRouter();

    const [quiz, setQuiz] = useState<LiveQuiz | null>(null);
    const [results, setResults] = useState<LiveQuizResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!quizId) return;

        const fetchData = async () => {
            try {
                // 1. Fetch Quiz Details
                const quizRef = doc(db, 'live_quizzes', quizId as string);
                const quizSnap = await getDoc(quizRef);
                if (!quizSnap.exists()) {
                    alert('Quiz not found');
                    router.push('/admin/live-quizzes');
                    return;
                }
                setQuiz({ id: quizSnap.id, ...quizSnap.data() } as LiveQuiz);

                // 2. Fetch Results
                const resultsRef = collection(db, 'live_quiz_results');
                const q = query(resultsRef, where('quizId', '==', quizId));
                const querySnapshot = await getDocs(q);

                const fetchedResults = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveQuizResult));

                // 3. Sort & Rank locally
                // Sort by Score (Desc), then TimeTaken (Asc)
                fetchedResults.sort((a, b) => {
                    if (b.score !== a.score) return b.score - a.score;
                    return a.timeTaken - b.timeTaken;
                });

                // Assign Client-Side Ranks for display
                const rankedResults = fetchedResults.map((res, index) => ({
                    ...res,
                    rank: index + 1
                }));

                setResults(rankedResults);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [quizId, router]);

    // Stats Calculation
    const totalParticipants = results.length;
    const avgScore = totalParticipants > 0
        ? (results.reduce((acc, curr) => acc + curr.score, 0) / totalParticipants).toFixed(1)
        : 0;
    const topScore = results.length > 0 ? results[0].score : 0;


    if (loading) {
        return (
            <div className="min-h-screen bg-pw-surface flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-pw-indigo border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-pw-surface p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/admin/live-quizzes" className="text-gray-400 font-bold hover:text-pw-indigo flex items-center gap-1 mb-4">
                        <HiArrowLeft /> Back to Quizzes
                    </Link>
                    <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                        <div>
                            <h1 className="text-3xl font-display font-black text-pw-violet mb-2">{quiz?.title}</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                                <span className="bg-white border px-2 py-1 rounded-md">
                                    {new Date(quiz!.startTime).toLocaleDateString()}
                                </span>
                                <span>•</span>
                                <span>{quiz?.subject}</span>
                                <span>•</span>
                                <span>Class {quiz?.allowedClasses?.join(', ')}</span>
                            </div>
                        </div>
                        {/* <button className="bg-white text-pw-indigo border border-pw-indigo/20 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-pw-indigo/5 transition-colors">
                            <HiDownload /> Export Excel
                        </button> */}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-pw-border shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                            <FaUsers className="text-2xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Participants</p>
                            <p className="text-3xl font-black text-gray-800">{totalParticipants}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-pw-border shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-green-50 text-green-600 rounded-xl">
                            <FaChartLine className="text-2xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Avg. Score</p>
                            <p className="text-3xl font-black text-gray-800">{avgScore}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-pw-border shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-yellow-50 text-yellow-600 rounded-xl">
                            <FaTrophy className="text-2xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Top Score</p>
                            <p className="text-3xl font-black text-gray-800">{topScore}</p>
                        </div>
                    </div>
                </div>

                {/* Leaderboard Table */}
                <div className="bg-white rounded-2xl border border-pw-border shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-pw-border">
                        <h3 className="text-lg font-bold text-gray-800">Leaderboard</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Rank</th>
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Score</th>
                                    <th className="px-6 py-4">Accuracy</th>
                                    <th className="px-6 py-4">Time Taken</th>
                                    <th className="px-6 py-4">Submitted At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {results.map((res) => (
                                    <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                                ${res.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                                                    res.rank === 2 ? 'bg-gray-200 text-gray-700' :
                                                        res.rank === 3 ? 'bg-orange-100 text-orange-700' :
                                                            'bg-gray-50 text-gray-500'
                                                }`}>
                                                {res.rank === 1 ? <FaTrophy /> : res.rank}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs uppercase">
                                                    {res.userName?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{res.userName}</p>
                                                    <p className="text-xs text-gray-400">{res.userId.slice(0, 6)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-pw-indigo">{res.score}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-600">
                                            {Math.round(res.accuracy)}%
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-600 flex items-center gap-1">
                                            <FaClock className="text-gray-300" />
                                            {Math.floor(res.timeTaken / 60)}m {Math.floor(res.timeTaken % 60)}s
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {new Date(res.submittedAt).toLocaleTimeString()}
                                        </td>
                                    </tr>
                                ))}
                                {results.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">
                                            No results found yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
