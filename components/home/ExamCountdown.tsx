'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaClock, FaFire, FaEdit, FaTimes, FaCheck } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

// Board exam dates for 2026 (approximate)
const BOARD_EXAM_DATES: Record<string, string> = {
    'bseb': '2026-02-14', // Bihar Board typically starts mid-Feb
    'cbse': '2026-02-15', // CBSE typically starts mid-Feb
    'icse': '2026-02-20',
    'up': '2026-02-18',
    'mp': '2026-02-17',
    'maharashtra': '2026-02-21',
    'rbse': '2026-03-01',
    'jac': '2026-02-25',
    'uk': '2026-02-20',
    'wb': '2026-02-18',
    'other': '2026-03-01'
};

const MOTIVATIONAL_MESSAGES = [
    { threshold: 100, message: "You have time! Stick to your study plan 📚", color: "text-green-600" },
    { threshold: 60, message: "Two months to go! Focus on weak areas 💪", color: "text-blue-600" },
    { threshold: 30, message: "One month left! Revision mode ON 🔥", color: "text-orange-600" },
    { threshold: 15, message: "Final stretch! Solve previous years 📝", color: "text-red-500" },
    { threshold: 7, message: "Last week! Stay calm, you've got this 🙏", color: "text-purple-600" },
    { threshold: 0, message: "Exam time! Give your best! 🌟", color: "text-indigo-600" }
];

export const ExamCountdown = () => {
    const { userProfile, user } = useAuth();
    const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [customDate, setCustomDate] = useState('');
    const [saving, setSaving] = useState(false);

    // Memoize exam date calculation to prevent re-renders and ensure stability
    const examDate = useMemo(() => {
        if (!userProfile) return null;

        if (userProfile.examDate) {
            return new Date(userProfile.examDate);
        }

        const board = (userProfile.board || 'other').toLowerCase();
        // Ensure strictly matched key or fallback
        const dateString = BOARD_EXAM_DATES[board] || BOARD_EXAM_DATES['other'];
        return new Date(dateString);
    }, [userProfile]);

    useEffect(() => {
        if (!examDate) return;

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const target = examDate.getTime();
            const difference = target - now;

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((difference % (1000 * 60)) / 1000)
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [examDate]); // Only re-run if calculated date changes

    const getMotivationalMessage = () => {
        if (!timeLeft) return MOTIVATIONAL_MESSAGES[0];
        for (const msg of MOTIVATIONAL_MESSAGES) {
            if (timeLeft.days >= msg.threshold) return msg;
        }
        return MOTIVATIONAL_MESSAGES[MOTIVATIONAL_MESSAGES.length - 1];
    };

    const handleSaveDate = async () => {
        if (!user || !customDate) return;

        setSaving(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                examDate: new Date(customDate).getTime()
            });
            toast.success('Exam date updated!');
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving exam date:', error);
            toast.error('Failed to save exam date');
        } finally {
            setSaving(false);
        }
    };

    const motivation = getMotivationalMessage();


    if (!userProfile || !timeLeft) return null;

    // Calculate progress (assuming 6 month preparation period)
    const totalDays = 180;
    const daysGone = Math.max(0, totalDays - timeLeft.days);
    const progressPercent = Math.min(100, (daysGone / totalDays) * 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full relative overflow-hidden bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-3xl p-6 shadow-xl"
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 flex items-center gap-2">
                        <FaClock /> Exam Countdown
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        Target: {examDate?.toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <div className="flex items-center gap-2 bg-white/50 rounded-lg p-1 border border-gray-200">
                            <input
                                type="date"
                                value={customDate}
                                onChange={(e) => setCustomDate(e.target.value)}
                                className="bg-transparent border-none text-xs text-gray-800 focus:ring-0 px-2 py-1"
                            />
                            <button
                                onClick={handleSaveDate}
                                disabled={saving}
                                className="text-indigo-600 hover:text-indigo-700 p-1"
                            >
                                <FaCheck />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-gray-400 hover:text-indigo-500 transition-colors p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur-sm"
                        >
                            <FaEdit />
                        </button>
                    )}
                </div>
            </div>

            {/* Countdown Grid */}
            <div className="grid grid-cols-4 gap-3 md:gap-4 mb-6">
                {[
                    { label: 'Days', value: timeLeft.days, color: 'from-blue-500 to-cyan-500' },
                    { label: 'Hours', value: timeLeft.hours, color: 'from-indigo-500 to-blue-500' },
                    { label: 'Minutes', value: timeLeft.minutes, color: 'from-purple-500 to-indigo-500' },
                    { label: 'Seconds', value: timeLeft.seconds, color: 'from-pink-500 to-purple-500' },
                ].map((item, index) => (
                    <div key={index} className="flex flex-col items-center">
                        <div className={`w-full aspect-square rounded-2xl bg-gradient-to-br ${item.color} p-[1px] shadow-lg`}>
                            <div className="w-full h-full bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center relative overflow-hidden">
                                <span className={`text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br ${item.color}`}>
                                    {String(item.value).padStart(2, '0')}
                                </span>
                                {/* Glossy effect */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50"></div>
                            </div>
                        </div>
                        <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mt-2">
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Motivation Banner */}
            <div className={`rounded-xl p-3 flex items-center gap-3 bg-opacity-10 ${motivation.color.replace('text-', 'bg-')}`}>
                <FaFire className={`${motivation.color} text-lg animate-pulse`} />
                <p className={`text-sm font-bold ${motivation.color}`}>
                    {motivation.message}
                </p>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full shadow-sm"
                />
            </div>
        </motion.div>
    );
};
