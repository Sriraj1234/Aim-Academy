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
            className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg mb-6"
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl transform translate-x-20 -translate-y-20" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl transform -translate-x-10 translate-y-10" />
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <FaCalendarAlt className="text-lg" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Board Exam Countdown</h3>
                            <p className="text-xs text-white/70">
                                {examDate?.toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setIsEditing(!isEditing);
                            setCustomDate(examDate?.toISOString().split('T')[0] || '');
                        }}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    >
                        {isEditing ? <FaTimes /> : <FaEdit />}
                    </button>
                </div>

                {/* Date Editor */}
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-4 flex gap-2"
                    >
                        <input
                            type="date"
                            value={customDate}
                            onChange={(e) => setCustomDate(e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                        <button
                            onClick={handleSaveDate}
                            disabled={saving}
                            className="px-4 py-2 bg-white text-purple-600 font-bold rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <FaCheck />
                            )}
                            Save
                        </button>
                    </motion.div>
                )}

                {/* Countdown Timer */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                        { value: timeLeft.days, label: 'Days' },
                        { value: timeLeft.hours, label: 'Hours' },
                        { value: timeLeft.minutes, label: 'Mins' },
                        { value: timeLeft.seconds, label: 'Secs' }
                    ].map((item, idx) => (
                        <motion.div
                            key={item.label}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: idx * 0.1, type: 'spring' }}
                            className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center"
                        >
                            <div className="text-2xl md:text-3xl font-black">
                                {String(item.value).padStart(2, '0')}
                            </div>
                            <div className="text-[10px] md:text-xs text-white/70 uppercase tracking-wider">
                                {item.label}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                    <div className="flex justify-between text-xs text-white/70 mb-1">
                        <span>Preparation Progress</span>
                        <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                        />
                    </div>
                </div>

                {/* Motivational Message */}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                    <FaFire className="text-orange-300 animate-pulse" />
                    <p className="text-sm font-medium">{motivation.message}</p>
                </div>
            </div>
        </motion.div>
    );
};
