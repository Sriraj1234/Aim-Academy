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
            className="w-full relative overflow-hidden rounded-3xl mb-6 shadow-xl"
        >
            {/* Background with Gradient Mesh */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#DB2777]"></div>

            {/* Glass Overlay Pattern */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl"></div>

            <div className="relative z-10 p-4 md:p-6 text-white">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4 md:mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md border border-white/20 shadow-inner">
                            <FaCalendarAlt className="text-xl" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg md:text-xl leading-tight">Board Exam</h3>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="text-xs md:text-sm text-white/80 hover:text-white flex items-center gap-1.5 mt-0.5 transition-colors group"
                            >
                                <span>
                                    {examDate?.toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </span>
                                <FaEdit className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px]" />
                            </button>
                        </div>
                    </div>

                    {/* Motivation Badge */}
                    <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
                        <FaFire className="text-orange-300 animate-pulse text-xs" />
                        <span className="text-xs font-medium">{motivation.message}</span>
                    </div>
                </div>

                {/* Date Editor */}
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-6 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20"
                    >
                        <p className="text-xs text-white/70 mb-2 font-medium uppercase tracking-wide">Set Exam Date</p>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={customDate}
                                onChange={(e) => setCustomDate(e.target.value)}
                                className="flex-1 px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:bg-black/30 transition-colors"
                            />
                            <button
                                onClick={handleSaveDate}
                                disabled={saving}
                                className="px-4 py-2 bg-white text-indigo-600 font-bold text-sm rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg"
                            >
                                {saving ? (
                                    <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <FaCheck />
                                )}
                                <span>Save</span>
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Counter Grid */}
                <div className="grid grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
                    {[
                        { value: timeLeft.days, label: 'Days' },
                        { value: timeLeft.hours, label: 'Hours' },
                        { value: timeLeft.minutes, label: 'Mins' },
                        { value: timeLeft.seconds, label: 'Secs' }
                    ].map((item, idx) => (
                        <div key={item.label} className="group relative">
                            <div className="absolute inset-0 bg-white/5 rounded-2xl transform transition-transform group-hover:scale-105"></div>
                            <div className="relative bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 md:p-4 text-center shadow-lg group-hover:bg-white/15 transition-colors">
                                <div className="text-xl md:text-4xl font-black mb-1 font-mono tracking-tight">
                                    {String(item.value).padStart(2, '0')}
                                </div>
                                <div className="text-[10px] md:text-xs font-medium text-white/60 uppercase tracking-widest">
                                    {item.label}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Progress Bar & Footer */}
                <div className="space-y-2">
                    <div className="flex justify-between items-end px-1">
                        <span className="text-[10px] font-medium text-white/60 uppercase tracking-wider">Preparation Timeline</span>
                        <span className="text-sm font-bold">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-2.5 bg-black/20 rounded-full overflow-hidden p-[2px]">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-green-300 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                        />
                    </div>

                    {/* Mobile Only Message */}
                    <div className="md:hidden mt-3 flex items-center justify-center gap-2 text-white/80">
                        <FaFire className="text-orange-300 text-xs" />
                        <span className="text-xs">{motivation.message}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
