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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full relative overflow-hidden rounded-2xl mb-4 shadow-md group"
        >
            {/* Compact Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>

            {/* Slim Progress Bar at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"
                />
            </div>

            <div className="relative z-10 px-4 py-3 text-white flex items-center justify-between gap-4">
                {/* Left: Icon & Title */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                        <span className="text-xl font-bold">{timeLeft.days}</span>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="font-bold text-sm leading-none">Days Left</h3>
                            <span className="text-[10px] opacity-70 font-medium uppercase tracking-wider">Board Exam</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] opacity-80 flex items-center gap-1">
                                {timeLeft.hours}h {timeLeft.minutes}m
                            </span>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] hover:text-white/100 text-white/60"
                            >
                                <FaEdit />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Motivation or Edit Form */}
                <div className="flex-1 flex justify-end">
                    {isEditing ? (
                        <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1 pr-2 border border-white/10 backdrop-blur-md animate-in fade-in slide-in-from-right-5">
                            <input
                                type="date"
                                value={customDate}
                                onChange={(e) => setCustomDate(e.target.value)}
                                className="bg-transparent border-none text-xs text-white focus:ring-0 px-2 py-1 w-28"
                            />
                            <button
                                onClick={handleSaveDate}
                                disabled={saving}
                                className="w-6 h-6 rounded-md bg-white text-indigo-600 flex items-center justify-center hover:bg-indigo-50 transition-colors"
                            >
                                {saving ? <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <FaCheck className="text-xs" />}
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-right hidden sm:block opacity-90 max-w-[200px] truncate">
                                {motivation.message}
                            </p>
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                                <FaFire className={`${motivation.color.replace('text-', 'text-')} text-orange-300 text-sm animate-pulse`} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
