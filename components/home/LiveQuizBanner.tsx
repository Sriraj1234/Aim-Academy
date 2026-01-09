'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, where, getDoc } from 'firebase/firestore';
import { LiveQuiz } from '@/data/types';
import Link from 'next/link';
import { FaClock, FaCalendarAlt, FaPlayCircle, FaBell, FaCheckCircle, FaTrophy } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { setDoc, doc, updateDoc, increment } from 'firebase/firestore';

export const LiveQuizBanner = () => {
    const [quizzes, setQuizzes] = useState<LiveQuiz[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Query logic: Fetch all, then filter client side for complex time windows
        // In a real app with many quizzes, we'd want a more specific compound query or cloud function
        const q = query(
            collection(db, 'live_quizzes'),
            orderBy('startTime', 'desc') // Newest first
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveQuiz));
            const now = Date.now();
            const OneDayMs = 24 * 60 * 60 * 1000;

            const relevantQuizzes = data.filter(q => {
                // Keep if:
                // 1. Not started yet (Upcoming)
                // 2. Currently Live (now <= endTime)
                // 3. Ended but within 24 hours (now <= endTime + 24h)
                return q.endTime + OneDayMs > now;
            });

            // Sort: Live first, then Upcoming (nearest), then Ended (most recent)
            relevantQuizzes.sort((a, b) => {
                const aLive = now >= a.startTime && now <= a.endTime;
                const bLive = now >= b.startTime && now <= b.endTime;
                if (aLive && !bLive) return -1;
                if (!aLive && bLive) return 1;
                return a.startTime - b.startTime;
            });

            setQuizzes(relevantQuizzes);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading || quizzes.length === 0) return null;

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-pw-violet pl-3 border-l-4 border-red-500 animate-pulse">
                Live Events
            </h3>
            <div className="grid gap-4">
                {quizzes.map((quiz, index) => {
                    return (
                        <QuizCard key={quiz.id} quiz={quiz} index={index} />
                    );
                })}
            </div>
        </div>
    );
};

const QuizCard = ({ quiz, index }: { quiz: LiveQuiz, index: number }) => {
    const { user } = useAuth();
    const [reminderSet, setReminderSet] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Status Logic
    const now = Date.now();
    const isUpcoming = now < quiz.startTime;
    const isLive = now >= quiz.startTime && now <= quiz.endTime;
    const isEnded = now > quiz.endTime;
    const isCalculating = isEnded && (now < quiz.endTime + (10 * 60 * 1000)); // 10 mins after end
    const isResultReady = isEnded && !isCalculating;

    useEffect(() => {
        setMounted(true);
        const checkReminder = async () => {
            if (user && isUpcoming) {
                try {
                    const docSnap = await getDoc(doc(db, 'live_quizzes', quiz.id, 'reminders', user.uid));
                    if (docSnap.exists()) {
                        setReminderSet(true);
                    }
                } catch (e) { }
            }
        };

        checkReminder();
        return () => setMounted(false);
    }, [user, quiz.id, isUpcoming]);

    const handleNotify = async () => {
        if (!user) {
            alert("Please login to set reminders.");
            return;
        }
        try {
            setReminderSet(true);
            await setDoc(doc(db, 'live_quizzes', quiz.id, 'reminders', user.uid), {
                uid: user.uid,
                email: user.email,
                timestamp: Date.now()
            });
            const quizRef = doc(db, 'live_quizzes', quiz.id);
            await updateDoc(quizRef, {
                participantsCount: increment(1)
            });
        } catch (e) {
            console.error(e);
            if (mounted) setReminderSet(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-5 rounded-2xl border relative overflow-hidden group ${isLive
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-200'
                : 'bg-white border-pw-border hover:border-pw-indigo shadow-pw-md hover:shadow-lg'
                }`}
        >
            {isLive && (
                <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
                    <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-white rounded-full blur-3xl"></div>
                </div>
            )}

            <div className="flex justify-between items-start gap-4 relative z-10">
                <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        {isLive && (
                            <span className="px-2 py-0.5 bg-white text-red-600 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-red-600"></span> LIVE NOW
                            </span>
                        )}
                        {isUpcoming && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 border border-gray-200">
                                <FaCalendarAlt /> UPCOMING
                            </span>
                        )}
                        {isEnded && (
                            <span className="px-2 py-0.5 bg-gray-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                                <FaCheckCircle /> ENDED
                            </span>
                        )}

                        <span className={`text-[10px] font-bold uppercase tracking-wider opacity-80 ${isLive ? 'text-white' : 'text-gray-400'}`}>
                            {quiz.type}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isLive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            {quiz.subject || 'General'}
                        </span>
                        {quiz.allowedClasses && quiz.allowedClasses.length > 0 && (
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isLive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                Class {quiz.allowedClasses.join(', ')}
                            </span>
                        )}
                    </div>
                    <h4 className={`text-lg font-bold mb-1 ${isLive ? 'text-white' : 'text-gray-800'}`}>
                        {quiz.title}
                    </h4>
                    <p className={`text-sm mb-4 line-clamp-2 ${isLive ? 'text-white/90' : 'text-gray-500'}`}>
                        {quiz.description || 'Join now to test your knowledge!'}
                    </p>

                    <div className="flex items-center gap-2 text-xs font-medium opacity-80">
                        <FaClock className={isLive ? 'text-white' : 'text-gray-400'} />
                        <span className={isLive ? 'text-white' : 'text-gray-500'}>
                            {isUpcoming ? `Starts ${new Date(quiz.startTime).toLocaleString()}` :
                                isLive ? `Ends ${new Date(quiz.endTime).toLocaleTimeString()}` :
                                    `Ended ${new Date(quiz.endTime).toLocaleString()}`}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    {isLive && (
                        <Link
                            href={`/play/live/${quiz.id}`}
                            className="px-6 py-2 bg-white text-red-600 font-bold rounded-xl shadow-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                            <FaPlayCircle /> Join Quiz
                        </Link>
                    )}

                    {isUpcoming && (
                        <button
                            onClick={handleNotify}
                            disabled={reminderSet}
                            className={`px-6 py-2 font-bold rounded-xl transition-all flex items-center gap-2 ${reminderSet
                                ? 'bg-green-100 text-green-700 cursor-default'
                                : 'bg-pw-indigo text-white hover:bg-pw-violet shadow-lg shadow-pw-indigo/20 active:scale-95'
                                }`}
                        >
                            {reminderSet ? (
                                <>
                                    <FaCheckCircle /> Reminder Set
                                </>
                            ) : (
                                <>
                                    <FaBell /> Notify Me
                                </>
                            )}
                        </button>
                    )}

                    {isCalculating && (
                        <button disabled className="px-6 py-2 bg-gray-100 text-gray-500 font-bold rounded-xl cursor-wait flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                            Result in 10m
                        </button>
                    )}

                    {isResultReady && (
                        <Link
                            href={`/play/result?mode=live&quizId=${quiz.id}`}
                            className="px-6 py-2 bg-pw-indigo text-white font-bold rounded-xl shadow-lg hover:bg-pw-violet transition-colors flex items-center gap-2"
                        >
                            <FaTrophy /> View Leaderboard
                        </Link>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
