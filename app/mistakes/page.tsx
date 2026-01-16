'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/shared/Header';
import { useAuth } from '@/context/AuthContext';
// import { db } from '@/lib/firebase'; // DB no longer needed for mistakes
import { mistakesLocalStore } from '@/utils/mistakesLocalStore';
import { MistakeCard } from '@/components/mistakes/MistakeCard';
import { FaFilter, FaBookOpen, FaMedal } from 'react-icons/fa';
import Link from 'next/link';

interface Mistake {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number | string;
    userAnswer: number | string;
    subject: string;
    chapter: string;
    timestamp: number;
}

export default function MistakesPage() {
    const { user } = useAuth();
    const [mistakes, setMistakes] = useState<Mistake[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterSubject, setFilterSubject] = useState<string>('all');

    useEffect(() => {
        const fetchMistakes = () => {
            if (!user) return;
            setLoading(true);
            try {
                // Local Storage Fetch
                const data = mistakesLocalStore.getMistakes(user.uid);
                // The local store logic already returns raw objects, but let's ensure they match 'Mistake' interface
                // The interfaces are almost identical.
                setMistakes(data as Mistake[]); // Cast or map if needed
            } catch (err) {
                console.error("Error fetching mistakes:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMistakes();

        // Optional: Listen for storage events if we want multi-tab sync (not critical)
    }, [user]);

    const handleRemove = (id: string) => {
        if (user) {
            mistakesLocalStore.removeMistake(user.uid, id);
            setMistakes(prev => prev.filter(m => m.id !== id));
        }
    };

    const distinctSubjects = Array.from(new Set(mistakes.map(m => m.subject?.toLowerCase()))).filter(Boolean);

    // Filter logic
    const filteredMistakes = filterSubject === 'all'
        ? mistakes
        : mistakes.filter(m => m.subject?.toLowerCase() === filterSubject);

    return (
        <div className="min-h-screen bg-pw-surface pb-20 font-sans">
            <Header />

            <main className="pt-24 px-4 max-w-7xl mx-auto space-y-6">

                {/* Intro Header */}
                <div className="bg-white rounded-[2rem] p-6 md:p-10 border border-pw-border shadow-pw-md text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-red-100 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4 shadow-inner">
                            ❌
                        </div>
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-pw-violet mb-2">
                            Mistake Notebook
                        </h1>
                        <p className="text-gray-500 max-w-lg mx-auto text-lg leading-relaxed mb-6">
                            "Success consists of going from failure to failure with no loss of enthusiasm." <br />
                            <span className="text-sm font-bold text-pw-indigo mt-2 block">- Winston Churchill</span>
                        </p>

                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full font-bold text-sm border border-red-100">
                            You have {mistakes.length} mistakes to master
                        </div>
                    </div>

                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 opacity-60" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 opacity-60" />
                </div>

                {/* Filter Bar */}
                {mistakes.length > 0 && (
                    <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
                        <button
                            onClick={() => setFilterSubject('all')}
                            className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${filterSubject === 'all' ? 'bg-pw-indigo text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-pw-border'}`}
                        >
                            All Mistakes
                        </button>
                        {distinctSubjects.map(sub => (
                            <button
                                key={sub}
                                onClick={() => setFilterSubject(sub)}
                                className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap capitalize transition-all ${filterSubject === sub ? 'bg-pw-indigo text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-pw-border'}`}
                            >
                                {sub}
                            </button>
                        ))}
                    </div>
                )}

                {/* Content Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-10 h-10 border-4 border-pw-indigo border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-400 font-bold">Loading your mistakes...</p>
                    </div>
                ) : mistakes.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                            🎉
                        </div>
                        <h3 className="text-xl font-bold text-pw-violet mb-2">Clean Sheet!</h3>
                        <p className="text-gray-500 max-w-xs mx-auto mb-6">
                            You don't have any pending mistakes. <br />Go take a quiz to find new areas to improve!
                        </p>
                        <Link href="/play" className="px-6 py-3 bg-pw-indigo text-white rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all">
                            Start Practicing
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMistakes.length === 0 ? (
                            <div className="col-span-full text-center py-10 text-gray-400">
                                No mistakes found for this subject. Good job!
                            </div>
                        ) : (
                            filteredMistakes.map(mistake => (
                                <MistakeCard
                                    key={mistake.id}
                                    {...mistake}
                                    onRemove={handleRemove}
                                />
                            ))
                        )}
                    </div>
                )}

            </main>

            {/* SEO / Educational Content for AdSense */}
            <section className="max-w-7xl mx-auto px-4 pb-12 text-gray-500 text-sm leading-relaxed">
                <div className="bg-white rounded-2xl p-6 border border-pw-border shadow-sm mt-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">The Science of Mistake Analysis</h2>
                    <p className="mb-4">
                        Mistake analysis is the fastest way to improve. This "Mistake Notebook" automatically tracks every question you get wrong.
                        By revisiting these specific problems, you prevent repeating errors in the final exam.
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-bold text-gray-800 mb-2">Why track mistakes?</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Identify patterns in your errors (e.g., calculation vs. conceptual).</li>
                                <li>Focus your study time on weak zones rather than what you already know.</li>
                                <li>Build confidence by turning "weaknesses" into strengths.</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 mb-2">Pro Tip:</h3>
                            <p>
                                Don't just delete mistakes! Try to solve them again without looking at the answer.
                                Only remove them when you can explain the logic to someone else.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
