'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import PuzzleGame from '@/components/mind-game/PuzzleGame';
import { FaBrain, FaLock, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function MindGamePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activePuzzle, setActivePuzzle] = useState<any>(null);
    const [dailyCount, setDailyCount] = useState(0);
    const [hasReachedLimit, setHasReachedLimit] = useState(false);
    const [puzzles, setPuzzles] = useState<any[]>([]);

    useEffect(() => {
        checkDailyLimit();
        fetchPuzzles();
    }, []);

    const checkDailyLimit = () => {
        const today = new Date().toDateString();
        const storedDate = localStorage.getItem('mind_game_date');
        const storedCount = parseInt(localStorage.getItem('mind_game_count') || '0');

        if (storedDate !== today) {
            // Reset for new day
            localStorage.setItem('mind_game_date', today);
            localStorage.setItem('mind_game_count', '0');
            setDailyCount(0);
        } else {
            setDailyCount(storedCount);
            if (storedCount >= 5) {
                setHasReachedLimit(true);
            }
        }
    };

    const fetchPuzzles = async () => {
        try {
            const q = query(
                collection(db, 'mind_games'),
                where('isActive', '==', true),
                orderBy('createdAt', 'desc'),
                limit(10)
            );
            const snapshot = await getDocs(q);
            const fetchedPuzzles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPuzzles(fetchedPuzzles);

            // Auto select random if available
            // setActivePuzzle(fetchedPuzzles[0]); 
        } catch (error) {
            console.error("Error fetching mind games:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStart = (puzzle: any) => {
        if (hasReachedLimit) return;
        setActivePuzzle(puzzle);
    };

    const handleComplete = (moves: number) => {
        // Increment Count
        const newCount = dailyCount + 1;
        setDailyCount(newCount);
        localStorage.setItem('mind_game_count', newCount.toString());

        if (newCount >= 5) {
            setHasReachedLimit(true);
        }
    };

    const handleExit = () => {
        setActivePuzzle(null);
        // if limit reached, show summary?
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <FaSpinner className="animate-spin text-3xl text-purple-600" />
        </div>
    );

    // Game Mode
    if (activePuzzle) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center py-8">
                <PuzzleGame
                    imageUrl={activePuzzle.imageUrl}
                    difficulty={activePuzzle.difficulty}
                    onComplete={handleComplete}
                    onExit={handleExit}
                />
            </div>
        );
    }

    // Selection Menu
    return (
        <div className="min-h-screen bg-slate-50 font-sans p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="mb-10 text-center">
                    <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
                        <FaBrain />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-2">Brain Warmup</h1>
                    <p className="text-slate-500 max-w-md mx-auto">Complete a quick visual puzzle to activate your focus before studying.</p>
                </header>

                {/* Daily Progress */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-10 flex items-center justify-between max-w-md mx-auto">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Daily Limit</p>
                        <p className={`text-2xl font-bold ${hasReachedLimit ? 'text-green-500' : 'text-slate-800'}`}>
                            {dailyCount} <span className="text-lg text-slate-300">/ 5</span>
                        </p>
                    </div>
                    <div className="h-2 flex-1 mx-6 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${hasReachedLimit ? 'bg-green-500' : 'bg-purple-500'}`}
                            style={{ width: `${(dailyCount / 5) * 100}%` }}
                        />
                    </div>
                    {hasReachedLimit && <FaCheckCircle className="text-green-500 text-2xl" />}
                </div>

                {hasReachedLimit ? (
                    <div className="text-center py-12 bg-green-50 rounded-3xl border border-green-100 max-w-lg mx-auto">
                        <h2 className="text-2xl font-bold text-green-700 mb-2">Brain Fully Charged! ⚡</h2>
                        <p className="text-green-600 mb-8 px-4">You've completed your daily exercises. Now it's the perfect time to focus on your studies.</p>
                        <button
                            onClick={() => router.push('/')}
                            className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all hover:-translate-y-1"
                        >
                            Back to Study Hub
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Default Fallback if no db puzzles */}
                        {puzzles.length === 0 && (
                            <div
                                onClick={() => handleStart({
                                    imageUrl: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                                    difficulty: 'medium'
                                })}
                                className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all"
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    alt="Nature"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent p-6 flex flex-col justify-end">
                                    <h3 className="text-white font-bold text-lg">Alpine Lake</h3>
                                    <p className="text-white/80 text-sm">Medium Difficulty</p>
                                </div>
                            </div>
                        )}

                        {puzzles.map(puzzle => (
                            <div
                                key={puzzle.id}
                                onClick={() => handleStart(puzzle)}
                                className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all"
                            >
                                <img
                                    src={puzzle.imageUrl}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    alt={puzzle.title}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent p-6 flex flex-col justify-end">
                                    <h3 className="text-white font-bold text-lg">{puzzle.title}</h3>
                                    <p className="text-white/80 text-sm capitalize">{puzzle.difficulty} Challenge</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
