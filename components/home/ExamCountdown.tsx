'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaClock, FaFire, FaEdit, FaTimes, FaCheck } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

const EXAM_DATE_CACHE_KEY = 'exam_date_cache';

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

// Board exam dates (month-day only — year is auto-calculated)
// Smart: if the date has already passed this year, it automatically shows next year's date.
const BOARD_EXAM_MONTH_DAY: Record<string, string> = {
    'bseb': '02-14', // Bihar Board — typically starts mid-Feb
    'cbse': '02-15',
    'icse': '02-20',
    'up': '02-18',
    'mp': '02-17',
    'maharashtra': '02-21',
    'rbse': '03-05',
    'jac': '02-25',
    'uk': '02-20',
    'wb': '02-18',
    'other': '03-05',
};

/** Returns the next upcoming exam date — always future, auto-advances each year */
function getNextExamDate(monthDay: string): Date {
    const now = new Date();
    const thisYear = now.getFullYear();
    const candidate = new Date(`${thisYear}-${monthDay}`);
    // If already past, use next year
    return candidate > now ? candidate : new Date(`${thisYear + 1}-${monthDay}`);
}


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

    // Memoize exam date calculation, with localStorage cache for instant load
    const examDate = useMemo(() => {
        // 1. If userProfile has loaded, use it and update cache
        if (userProfile) {
            let date: Date;
            if (userProfile.examDate) {
                const custom = new Date(userProfile.examDate);
                // If custom date is in the past, fall back to board default
                date = custom > new Date() ? custom : getNextExamDate(
                    BOARD_EXAM_MONTH_DAY[(userProfile.board || 'other').toLowerCase()]
                    ?? BOARD_EXAM_MONTH_DAY['other']
                );
            } else {
                const board = (userProfile.board || 'other').toLowerCase();
                const monthDay = BOARD_EXAM_MONTH_DAY[board] ?? BOARD_EXAM_MONTH_DAY['other'];
                date = getNextExamDate(monthDay);
            }
            // Persist to localStorage for instant next load
            try { localStorage.setItem(EXAM_DATE_CACHE_KEY, date.toISOString()); } catch { /* ignore */ }
            return date;
        }

        // 2. userProfile not yet loaded — use cached value for instant render
        try {
            const cached = localStorage.getItem(EXAM_DATE_CACHE_KEY);
            if (cached) return new Date(cached);
        } catch { /* ignore */ }

        return null;
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
            const date = new Date(customDate);
            const ts = date.getTime();
            await updateDoc(doc(db, 'users', user.uid), { examDate: ts });
            // Save ISO string to cache (more reliable than raw timestamp string)
            try { localStorage.setItem(EXAM_DATE_CACHE_KEY, date.toISOString()); } catch { /* ignore */ }
            toast.success('Exam date saved! ✅');
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving exam date:', error);
            toast.error('Could not save exam date. Try again.');
        } finally {
            setSaving(false);
        }

    };

    const motivation = getMotivationalMessage();


    if (!timeLeft) return null;

    // Calculate progress (assuming 6 month preparation period)
    const totalDays = 180;
    const daysGone = Math.max(0, totalDays - timeLeft.days);
    const progressPercent = Math.min(100, (daysGone / totalDays) * 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full relative overflow-hidden bg-[#0a0a0a] border border-red-900/30 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl shadow-red-900/10"
        >
            {/* Ambient Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-600/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-8 relative z-10 gap-2">
                <div className="w-full sm:w-auto">
                    <h2 className="text-base md:text-xl font-black text-white flex items-center gap-2 md:gap-3 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500 animate-[ping_1.5s_infinite]" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500 whitespace-nowrap">
                            Exam Countdown
                        </span>
                    </h2>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5 md:mt-1 tracking-widest pl-4 md:pl-5 uppercase">
                        Target: {examDate?.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                    </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto absolute top-0 right-0 sm:static">
                    {isEditing ? (
                        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1 border border-white/10 backdrop-blur-md">
                            <input
                                type="date"
                                value={customDate}
                                onChange={(e) => setCustomDate(e.target.value)}
                                className="bg-transparent border-none text-xs text-white focus:ring-0 px-2 py-1 font-mono w-28 md:w-auto"
                            />
                            <button
                                onClick={handleSaveDate}
                                disabled={saving}
                                className="text-green-400 hover:text-green-300 p-1 transition-colors"
                            >
                                <FaCheck />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-gray-600 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg"
                        >
                            <FaEdit className="text-sm" />
                        </button>
                    )}
                </div>
            </div>

            {/* Countdown Grid (Digital/Premium Look) */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-4 md:mb-8 relative z-10">
                {[
                    { label: 'Days', value: timeLeft.days, color: 'text-red-500' },
                    { label: 'Hours', value: timeLeft.hours, color: 'text-white' },
                    { label: 'Mins', value: timeLeft.minutes, color: 'text-white' },
                    { label: 'Secs', value: timeLeft.seconds, color: 'text-orange-500' },
                ].map((item, index) => (
                    <div key={index} className="flex flex-col items-center group">
                        <div className="w-full h-12 sm:h-auto sm:aspect-square rounded-lg md:rounded-2xl bg-[#111] border border-white/5 shadow-inner flex flex-col items-center justify-center relative overflow-hidden group-hover:border-red-500/30 transition-colors duration-500">
                            {/* Digital Glitch Decoration */}
                            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <span className={`text-xl sm:text-3xl md:text-4xl font-black font-mono tracking-tighter ${item.color} drop-shadow-[0_0_10px_rgba(255,0,0,0.3)]`}>
                                {String(item.value).padStart(2, '0')}
                            </span>
                        </div>
                        <span className="text-[8px] sm:text-[10px] font-bold text-gray-600 uppercase tracking-widest sm:tracking-[0.2em] mt-1.5 sm:mt-3 group-hover:text-red-500/70 transition-colors">
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Status / Motivation Bar */}
            <div className="relative z-10 bg-gradient-to-r from-red-950/30 to-transparent border-l-2 border-red-600 pl-3 md:pl-4 py-1.5 md:py-2 my-2 md:my-4">
                <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                    <FaFire className="text-orange-500 text-[10px] md:text-xs animate-pulse" />
                    <span className="text-[9px] md:text-[10px] text-orange-400 font-bold uppercase tracking-wider">Status: {timeLeft.days < 30 ? 'CRITICAL' : 'ACTIVE'}</span>
                </div>
                <p className="text-[11px] md:text-sm text-gray-300 font-medium leading-relaxed line-clamp-1 md:line-clamp-2">
                    "{motivation.message}"
                </p>
            </div>

            {/* Progress Bar (Thin & Sleek) */}
            <div className="mt-4 sm:mt-6 h-[2px] bg-gray-800 w-full relative z-10">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 shadow-[0_0_15px_rgba(255,69,0,0.6)]"
                />
            </div>
        </motion.div>
    );
};
