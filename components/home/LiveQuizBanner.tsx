'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { LiveQuiz } from '@/data/types';
import Link from 'next/link';
import { FaClock, FaCalendarAlt, FaPlayCircle, FaBell, FaCheckCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { setDoc, doc } from 'firebase/firestore';

export const LiveQuizBanner = () => {
    const [quizzes, setQuizzes] = useState<LiveQuiz[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const now = Date.now();
        // Simple query for now, filtering client side for more complex time logic or multiple statuses
        const q = query(
            collection(db, 'live_quizzes'),
            orderBy('startTime', 'asc') // Show nearest first
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveQuiz));
            const activeOrUpcoming = data.filter(q => q.endTime > Date.now());
            setQuizzes(activeOrUpcoming);
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
                    const now = Date.now();
                    const isLive = now >= quiz.startTime && now <= quiz.endTime;

                    return (
                        <QuizCard key={quiz.id} quiz={quiz} isLive={isLive} index={index} />
                    );
                })}
            </div>
        </div>
    );
};

const QuizCard = ({ quiz, isLive, index }: { quiz: LiveQuiz, isLive: boolean, index: number }) => {
    const { user } = useAuth(); // Assume useAuth is verified imported
    const [reminderSet, setReminderSet] = useState(false);

    const handleNotify = async () => {
        if (!user) {
            alert("Please login to set reminders.");
            return;
        }
        try {
            // Optimistic Update
            setReminderSet(true);
            await setDoc(doc(db, 'live_quizzes', quiz.id, 'reminders', user.uid), {
                uid: user.uid,
                email: user.email,
                timestamp: Date.now()
            });
            // Also add to global user reminders if needed, but this is enough for Cloud Functions
        } catch (e) {
            console.error(e);
            setReminderSet(false);
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
                        {isLive ? (
                            <span className="px-2 py-0.5 bg-white text-red-600 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-red-600"></span> LIVE NOW
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 border border-gray-200">
                                <FaCalendarAlt /> UPCOMING
                            </span>
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-wider opacity-80 ${isLive ? 'text-white' : 'text-gray-400'}`}>
                            {quiz.type}
                        </span>
                        {/* Display Subject and Class */}
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

                    {!isLive && (
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                            <FaClock />
                            <span>Starts {new Date(quiz.startTime).toLocaleString()}</span>
                            <span>•</span>
                            <span>{quiz.duration} Mins</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-end gap-2">
                    {isLive ? (
                        <Link
                            href={`/play/live/${quiz.id}`}
                            className="px-6 py-2 bg-white text-red-600 font-bold rounded-xl shadow-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                            <FaPlayCircle /> Join Quiz
                        </Link>
                    ) : (
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
                </div>
            </div>
        </motion.div>
    );
};
