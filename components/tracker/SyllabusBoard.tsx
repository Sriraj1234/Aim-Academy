'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaxonomy } from '@/hooks/useTaxonomy';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FaCheck, FaChevronDown, FaClock, FaTrophy, FaCalendarAlt, FaChartPie } from 'react-icons/fa';
import toast from 'react-hot-toast';

export const SyllabusBoard = () => {
    const { user, userProfile } = useAuth();
    const { data: syllabusData, loading: syllabusLoading, error: syllabusError } = useTaxonomy(userProfile?.board, userProfile?.class, userProfile?.stream);
    const [completedChapters, setCompletedChapters] = useState<string[]>([]);
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
    const [progressLoading, setProgressLoading] = useState(true);

    // Target Date: 20 Feb 2027
    const TARGET_DATE = new Date('2027-02-20T00:00:00');

    // Fetch Progress
    useEffect(() => {
        if (!user) return;
        const fetchProgress = async () => {
            try {
                const docRef = doc(db, 'users', user.uid, 'syllabus_tracker', 'progress');
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setCompletedChapters(snap.data().completed || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setProgressLoading(false);
            }
        };
        fetchProgress();
    }, [user]);

    // Save Progress
    const toggleChapter = async (chapterId: string) => {
        if (!user) return;
        const newCompleted = completedChapters.includes(chapterId)
            ? completedChapters.filter(id => id !== chapterId)
            : [...completedChapters, chapterId];

        setCompletedChapters(newCompleted); // Optimistic update

        try {
            await setDoc(doc(db, 'users', user.uid, 'syllabus_tracker', 'progress'), {
                completed: newCompleted,
                lastUpdated: Date.now()
            }, { merge: true });
        } catch (err) {
            console.error("Failed to save progress", err);
            toast.error("Failed to save progress");
        }
    };

    // Calculations
    const totalChapters = useMemo(() =>
        syllabusData.reduce((acc, sub) => acc + sub.chapters.length, 0),
        [syllabusData]);
    const completedCount = completedChapters.length;
    const percentage = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;

    // Countdown
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number } | null>(null);
    useEffect(() => {
        const calculateTime = () => {
            const now = new Date();
            const diff = TARGET_DATE.getTime() - now.getTime();
            if (diff > 0) {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                setTimeLeft({ days, hours });
            } else {
                setTimeLeft({ days: 0, hours: 0 });
            }
        };
        calculateTime();
        const timer = setInterval(calculateTime, 1000 * 60); // Update every minute
        return () => clearInterval(timer);
    }, []);

    if (syllabusLoading || progressLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pw-indigo mb-4"></div>
                <p className="text-gray-500 font-medium">Loading your syllabus...</p>
            </div>
        );
    }

    if (!syllabusData || syllabusData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-dashed border-gray-300">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Syllabus Found</h3>
                <p className="text-gray-500 max-w-md">
                    We couldn't find the syllabus for <b>{userProfile?.board?.toUpperCase()} Class {userProfile?.class}</b>.
                </p>
                <p className="text-xs text-gray-400 mt-4">Contact support if you think this is an error.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Stats */}
            <div className="bg-white rounded-3xl p-6 shadow-pw-md border border-pw-border relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-pw-indigo/5 rounded-full blur-[80px]" />

                <div className="relative z-10 grid md:grid-cols-2 gap-6 items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-pw-violet mb-2">{userProfile?.board?.toUpperCase() || 'Class'} {userProfile?.class} Prep Tracker</h2>
                        <p className="text-gray-500 mb-6">Track your syllabus for {userProfile?.board === 'bseb' ? 'Bihar Board' : 'Board'} Exams.</p>

                        <div className="flex gap-4">
                            <div className="bg-indigo-50 px-4 py-3 rounded-2xl flex items-center gap-3 border border-indigo-100">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                    <FaCalendarAlt />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-gray-400 uppercase">Target Date</div>

                                    <div className="font-bold text-gray-800">20 Feb, 2027</div>
                                </div>
                            </div>

                            <div className="bg-orange-50 px-4 py-3 rounded-2xl flex items-center gap-3 border border-orange-100">
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                    <FaClock />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-gray-400 uppercase">Time Left</div>
                                    <div className="font-bold text-gray-800">
                                        {timeLeft ? `${timeLeft.days}d ${timeLeft.hours}h` : 'Calculating...'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center md:justify-end gap-6">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            {/* Simple SVG Circular Progress */}
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent"
                                    strokeDasharray={351.86}
                                    strokeDashoffset={351.86 - (351.86 * percentage) / 100}
                                    className="text-pw-indigo transition-all duration-1000 ease-out"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-3xl font-black text-pw-violet">{percentage}%</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Ready</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-500">
                                Completed: <span className="font-bold text-gray-800">{completedCount}</span> / {totalChapters}
                            </div>
                            <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-bold inline-block">
                                Keep Going! 🚀
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subject List */}
            <div className="grid gap-4">
                {syllabusData.map((subject) => {
                    const subChapters = subject.chapters;
                    const subCompleted = subChapters.filter(c => completedChapters.includes(c.id)).length;
                    const subProgress = subChapters.length > 0 ? Math.round((subCompleted / subChapters.length) * 100) : 0;
                    const isExpanded = expandedSubject === subject.id;

                    return (
                        <div key={subject.id} className="bg-white rounded-2xl border border-pw-border shadow-sm overflow-hidden transition-all">
                            {/* Accordion Header */}
                            <button
                                onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}
                                className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${subject.color} flex items-center justify-center text-xl text-white shadow-md`}>
                                        {subject.icon}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-gray-800 capitalize">{subject.name}</h3>
                                        <p className="text-xs text-gray-500 font-medium">{subChapters.length} Chapters</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 md:gap-8">
                                    {/* Mini Progress Bar */}
                                    <div className="hidden md:block w-32">
                                        <div className="flex justify-between text-xs font-bold mb-1 text-gray-500">
                                            <span>Progress</span>
                                            <span>{subProgress}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div style={{ width: `${subProgress}%` }} className={`h-full bg-gradient-to-r ${subject.color}`} />
                                        </div>
                                    </div>

                                    <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} text-gray-400`}>
                                        <FaChevronDown />
                                    </div>
                                </div>
                            </button>

                            {/* Accordion Body */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-2 border-t border-gray-100 mt-2">
                                            {subChapters.map((chapter) => {
                                                // Create a unique-ish ID if name is used as ID to prevent overlap if names are same across subjects (unlikely but safe)
                                                // The hook uses name as ID.
                                                const uniqueChapterId = chapter.id;
                                                const isChecked = completedChapters.includes(uniqueChapterId);
                                                return (
                                                    <label
                                                        key={uniqueChapterId}
                                                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isChecked ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                                                    >
                                                        <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-pw-indigo border-pw-indigo' : 'bg-white border-gray-300'}`}>
                                                            {isChecked && <FaCheck className="text-white text-xs" />}
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={isChecked}
                                                                onChange={() => toggleChapter(uniqueChapterId)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className={`font-medium text-sm ${isChecked ? 'text-indigo-900 line-through opacity-70' : 'text-gray-700'}`}>
                                                                {chapter.title}
                                                            </div>
                                                            {chapter.category && (
                                                                <div className="text-xs text-gray-400 mt-0.5">
                                                                    <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] uppercase font-bold tracking-wider">{chapter.category}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}


            </div>
        </div>
    );
};
