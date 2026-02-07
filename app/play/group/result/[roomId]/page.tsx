'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FaTrophy, FaHome, FaMedal, FaStar, FaCheckCircle, FaTimesCircle, FaChartPie, FaUser } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { mistakesLocalStore } from '@/utils/mistakesLocalStore';

interface PlayerResult {
    id: string;
    name: string;
    score: number;
    accuracy: number;
    answers: { [key: number]: number };
    photoURL?: string;
}

interface QuestionData {
    question: string;
    options: string[];
    correctAnswer: number;
}

export default function ResultPage() {
    const { roomId } = useParams();
    const router = useRouter();
    const [leaderboard, setLeaderboard] = useState<PlayerResult[]>([]);
    const [questions, setQuestions] = useState<QuestionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'analysis'>('leaderboard');
    const { user } = useAuth(); // Get current user

    useEffect(() => {
        if (!roomId) return;

        const fetchResults = async () => {
            const docRef = doc(db, 'rooms', roomId as string);
            const snap = await getDoc(docRef);

            if (snap.exists()) {
                const data = snap.data();
                const roomQuestions = data.questions || [];
                setQuestions(roomQuestions);
                const players = Object.values(data.players || {}) as any[];

                // Calculate scores
                const results = players.map(p => {
                    let correctCount = 0;
                    const answers = p.answers || {};
                    Object.keys(answers).forEach(qIndex => {
                        const qIdx = parseInt(qIndex);
                        const ansIdx = answers[qIdx];
                        // Robust comparison (Number vs Number)
                        if (roomQuestions[qIdx]?.correctAnswer !== undefined &&
                            Number(roomQuestions[qIdx].correctAnswer) === Number(ansIdx)) {
                            correctCount++;
                        }
                    });

                    return {
                        id: p.id,
                        name: p.name,
                        photoURL: p.photoURL,
                        score: correctCount * 10, // 10 pts per question
                        accuracy: (correctCount / (roomQuestions.length || 1)) * 100,
                        answers: answers,
                        userId: p.userId // Ensure userId is captured
                    };
                });

                // Sort by score DESC
                results.sort((a, b) => b.score - a.score);
                setLeaderboard(results);

                // --- SAVE MISTAKES LOGIC ---
                // Identify the current user's player entry
                // We check by auth user ID (strongest) or fallback to name if needed (but auth is best for mistakes)
                if (user) {
                    const myPlayer = results.find(p => p.userId === user.uid);

                    if (myPlayer) {
                        const mistakesToSave: any[] = [];

                        roomQuestions.forEach((q: any, index: number) => {
                            const myAnswer = myPlayer.answers[index];
                            // Check if answered AND incorrect (Robust comparison)
                            if (myAnswer !== undefined && Number(myAnswer) !== Number(q.correctAnswer)) {
                                mistakesToSave.push({
                                    id: q.id || `group_q_${index}_${roomId}`, // Fallback ID if missing
                                    question: q.question,
                                    options: q.options,
                                    correctAnswer: q.correctAnswer,
                                    userAnswer: myAnswer,
                                    subject: data.subject || 'General',
                                    chapter: data.chapter || 'Group Quiz',
                                    timestamp: Date.now(),
                                    difficulty: 'medium' // Default for group
                                });
                            }
                        });

                        if (mistakesToSave.length > 0) {
                            console.log(`Saving ${mistakesToSave.length} mistakes to notebook (local)...`);
                            mistakesToSave.forEach(m => {
                                mistakesLocalStore.saveMistake(user.uid, {
                                    id: m.id,
                                    question: m.question,
                                    options: m.options,
                                    // Convert indices to text for consistency with single player mode
                                    correctAnswer: m.options[m.correctAnswer],
                                    userAnswer: m.options[m.userAnswer],
                                    subject: m.subject,
                                    chapter: m.chapter || 'Group Quiz'
                                });
                            });
                        }
                    }
                }
            }
            setLoading(false);
        };

        fetchResults();
    }, [roomId, user]); // Added user dependency

    // Double-Tap Back Logic
    const [showExitWarning, setShowExitWarning] = useState(false);

    useEffect(() => {
        window.history.pushState(null, '', window.location.href);

        const handlePopState = () => {
            const isWarningVisible = document.getElementById('exit-warning');
            if (isWarningVisible) {
                router.push('/');
            } else {
                window.history.pushState(null, '', window.location.href);
                setShowExitWarning(true);
                setTimeout(() => setShowExitWarning(false), 2000);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [router]);

    if (loading) return (
        <div className="min-h-screen bg-surface-off flex items-center justify-center text-brand-600">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
                <span className="font-bold text-lg">Calculating Results...</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-surface-off text-text-main font-sans overflow-x-hidden">
            {/* Background Decoration */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto p-6 md:p-8">

                {/* Header Actions */}
                <div className="flex justify-between items-center mb-8">
                    <button onClick={() => router.push('/')} className="flex items-center gap-2 text-text-sub hover:text-brand-600 transition-colors">
                        <FaHome /> Back Home
                    </button>
                    <div className="flex bg-white rounded-full p-1 shadow-sm border border-gray-100">
                        <button
                            onClick={() => setActiveTab('leaderboard')}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'leaderboard' ? 'bg-brand-600 text-white shadow-md' : 'text-text-sub hover:bg-gray-50'}`}
                        >
                            Leaderboard
                        </button>
                        <button
                            onClick={() => setActiveTab('analysis')}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'analysis' ? 'bg-brand-600 text-white shadow-md' : 'text-text-sub hover:bg-gray-50'}`}
                        >
                            Analysis
                        </button>
                    </div>
                </div>

                {activeTab === 'leaderboard' ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center"
                    >
                        <h1 className="text-3xl md:text-5xl font-display font-bold text-center mb-12 bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent flex justify-center items-center gap-4">
                            <FaTrophy className="text-yellow-400 drop-shadow-lg" />
                            Final Standings
                        </h1>

                        {/* Podium (Top 3) */}
                        {/* Podium (Top 3) - Mobile Optimized */}
                        <div className="flex items-end justify-center gap-2 md:gap-8 mb-12 md:mb-16 w-full max-w-2xl px-2 md:px-4 h-48 md:h-64">
                            {/* 2nd Place */}
                            {leaderboard[1] && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: "60%" }}
                                    className="flex-1 flex flex-col justify-end items-center"
                                >
                                    <div className="mb-2 md:mb-4 text-center">
                                        <div className="w-10 h-10 md:w-16 md:h-16 rounded-full border-2 md:border-4 border-gray-300 overflow-hidden mx-auto mb-1 md:mb-2 shadow-lg">
                                            {leaderboard[1].photoURL ? <img src={leaderboard[1].photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs md:text-base"><FaUser /></div>}
                                        </div>
                                        <p className="font-bold text-gray-600 text-[10px] md:text-sm truncate w-16 md:w-24 text-center mx-auto">{leaderboard[1].name}</p>
                                        <p className="font-bold text-gray-500 text-[9px] md:text-xs">{leaderboard[1].score}</p>
                                    </div>
                                    <div className="w-full h-full bg-gradient-to-t from-gray-300 to-gray-100 rounded-t-xl md:rounded-t-2xl shadow-xl flex items-start justify-center pt-2 md:pt-4 relative border-t border-white/50">
                                        <span className="text-2xl md:text-4xl font-bold text-gray-400/50">2</span>
                                    </div>
                                </motion.div>
                            )}

                            {/* 1st Place */}
                            {leaderboard[0] && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: "80%" }}
                                    className="flex-1 flex flex-col justify-end items-center z-10"
                                >
                                    <div className="mb-2 md:mb-4 text-center relative">
                                        <FaMedal className="text-yellow-400 text-2xl md:text-4xl absolute -top-8 md:-top-10 left-1/2 -translate-x-1/2 animate-bounce" />
                                        <div className="w-14 h-14 md:w-20 md:h-20 rounded-full border-2 md:border-4 border-yellow-400 overflow-hidden mx-auto mb-1 md:mb-2 shadow-yellow-500/30 shadow-xl">
                                            {leaderboard[0].photoURL ? <img src={leaderboard[0].photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-yellow-100 flex items-center justify-center text-yellow-600 text-sm md:text-base"><FaUser /></div>}
                                        </div>
                                        <p className="font-bold text-brand-900 text-xs md:text-base truncate w-20 md:w-28 text-center mx-auto">{leaderboard[0].name}</p>
                                        <p className="font-bold text-brand-600 text-[10px] md:text-sm">{leaderboard[0].score}</p>
                                    </div>
                                    <div className="w-full h-full bg-gradient-to-t from-yellow-400 to-yellow-200 rounded-t-xl md:rounded-t-2xl shadow-xl flex items-start justify-center pt-2 md:pt-4 relative border-t border-white/50">
                                        <span className="text-3xl md:text-5xl font-bold text-yellow-600/50">1</span>
                                    </div>
                                </motion.div>
                            )}

                            {/* 3rd Place */}
                            {leaderboard[2] && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: "50%" }}
                                    className="flex-1 flex flex-col justify-end items-center"
                                >
                                    <div className="mb-2 md:mb-4 text-center">
                                        <div className="w-10 h-10 md:w-16 md:h-16 rounded-full border-2 md:border-4 border-orange-300 overflow-hidden mx-auto mb-1 md:mb-2 shadow-lg">
                                            {leaderboard[2].photoURL ? <img src={leaderboard[2].photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs md:text-base"><FaUser /></div>}
                                        </div>
                                        <p className="font-bold text-orange-800 text-[10px] md:text-sm truncate w-16 md:w-24 text-center mx-auto">{leaderboard[2].name}</p>
                                        <p className="font-bold text-orange-600 text-[9px] md:text-xs">{leaderboard[2].score}</p>
                                    </div>
                                    <div className="w-full h-full bg-gradient-to-t from-orange-300 to-orange-100 rounded-t-xl md:rounded-t-2xl shadow-xl flex items-start justify-center pt-2 md:pt-4 relative border-t border-white/50">
                                        <span className="text-2xl md:text-4xl font-bold text-orange-600/40">3</span>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* List for the rest */}
                        <div className="w-full bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-soft border border-white/50">
                            {leaderboard.slice(3).map((player, index) => (
                                <div key={player.id} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-white/50 transition-colors rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="text-lg font-bold text-gray-400 w-6 text-center">{index + 4}</div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                                {player.photoURL && <img src={player.photoURL} alt={player.name} className="w-full h-full object-cover" />}
                                            </div>
                                            <span className="font-bold text-gray-700">{player.name}</span>
                                        </div>
                                    </div>
                                    <div className="font-mono font-bold text-brand-600">{player.score} pts</div>
                                </div>
                            ))}
                            {leaderboard.length <= 3 && (
                                <div className="text-center text-gray-400 py-4 italic">No other players</div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                    >
                        <h2 className="text-2xl font-display font-bold text-center mb-8 flex items-center justify-center gap-2">
                            <FaChartPie className="text-brand-500" />
                            Question Analysis
                        </h2>

                        {questions.map((q, qIndex) => (
                            <div key={qIndex} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex gap-4 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold flex-shrink-0">
                                        {qIndex + 1}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800">{q.question}</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    {q.options.map((opt, optIndex) => {
                                        const isCorrect = optIndex === q.correctAnswer;
                                        // Find who picked this
                                        // Find who picked this (Robust match)
                                        const pickedBy = leaderboard.filter(p => {
                                            const ans = p.answers && p.answers[qIndex];
                                            return ans !== undefined && Number(ans) === optIndex;
                                        });
                                        const isPicked = pickedBy.length > 0;

                                        return (
                                            <div key={optIndex} className={`relative p-3 rounded-xl border-2 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-transparent'} ${isPicked && !isCorrect ? 'border-red-200 bg-red-50' : ''}`}>
                                                <div className="flex justify-between items-start">
                                                    <span className={`text-sm font-medium ${isCorrect ? 'text-green-800' : 'text-gray-600'}`}>
                                                        {String.fromCharCode(65 + optIndex)}. {opt}
                                                    </span>
                                                    {isCorrect && <FaCheckCircle className="text-green-500 text-lg" />}
                                                    {!isCorrect && isPicked && <FaTimesCircle className="text-red-400 text-lg" />}
                                                </div>

                                                {/* Friend Faces */}
                                                {isPicked && (
                                                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                                                        {pickedBy.map(p => (
                                                            <div key={p.id} className="relative group cursor-help">
                                                                {p.photoURL ? (
                                                                    <img src={p.photoURL} className="w-6 h-6 rounded-full border border-white shadow-sm" title={p.name} />
                                                                ) : (
                                                                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-[10px] text-white font-bold border border-white shadow-sm" title={p.name}>
                                                                        {(p.name || 'User').charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                        <span className="text-xs text-gray-500 ml-1">
                                                            {pickedBy.length} {pickedBy.length === 1 ? 'friend' : 'friends'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Exit Warning Toast */}
            <AnimatePresence>
                {showExitWarning && (
                    <div id="exit-warning" className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-black/80 text-white px-6 py-3 rounded-full shadow-2xl backdrop-blur-md font-bold text-sm tracking-wide border border-white/20 whitespace-nowrap"
                        >
                            Press Back again to go home 🏠
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
