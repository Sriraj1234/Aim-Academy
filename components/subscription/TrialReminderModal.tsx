'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCrown, FaClock, FaTimes, FaRocket } from 'react-icons/fa';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface TrialReminderModalProps {
    isOpen?: boolean;
    onClose?: () => void;
    message?: string;
    subMessage?: string;
}

export const TrialReminderModal = ({ isOpen, onClose, message, subMessage }: TrialReminderModalProps = {}) => {
    const { userProfile, isInTrial } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [daysLeft, setDaysLeft] = useState(0);

    const isControlled = isOpen !== undefined;
    const show = isControlled ? isOpen : isVisible;

    useEffect(() => {
        if (isControlled) return; // Skip auto-show logic if controlled

        // 1. Check if user is logged in
        if (!userProfile) return;

        // 2. Check if user is already PRO
        if (userProfile.subscription?.plan === 'pro') return;

        // 3. Check if in trial period (7 days)
        // Robust Parsing for createdAt
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const c = userProfile.createdAt as any;
        const createdAt = typeof c === 'number' ? c : (c?.toMillis ? c.toMillis() : new Date(c || 0).getTime());
        const now = Date.now();
        const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);

        if (diffDays > 7) return; // Trial expired

        // 4. Determine Days Left
        const remaining = Math.ceil(7 - diffDays);
        setDaysLeft(remaining);

        // 5. Check if already shown TODAY
        const lastShownDate = localStorage.getItem('last_trial_reminder_date');
        const todayStr = new Date().toISOString().split('T')[0];

        if (lastShownDate === todayStr) {
            return; // Already shown today
        }

        // SHOW IT
        const timer = setTimeout(() => {
            setIsVisible(true);
            localStorage.setItem('last_trial_reminder_date', todayStr);
        }, 1500);

        return () => clearTimeout(timer);

    }, [userProfile, isControlled]);

    const close = () => {
        if (onClose) onClose();
        setIsVisible(false);
    };

    if (!show) return null;

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative"
                    >
                        {/* Decorative Header */}
                        <div className="bg-gradient-to-r from-pw-indigo via-purple-600 to-pink-500 p-6 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl transform -translate-x-10 translate-y-10" />

                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center text-3xl mb-3 shadow-lg border border-white/30">
                                <FaClock className="text-white animate-pulse" />
                            </div>

                            <h2 className="text-2xl font-black text-white mb-1 tracking-tight">
                                {message || "Free Trial Ending Soon!"}
                            </h2>
                            <p className="text-purple-100 font-medium text-sm">
                                {subMessage || "Don't lose your premium access"}
                            </p>

                            <button
                                onClick={close}
                                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 text-center">
                            {!message && (
                                <div className="mb-6">
                                    <span className="inline-block text-6xl font-black bg-clip-text text-transparent bg-gradient-to-br from-pw-indigo to-purple-600">
                                        {daysLeft}
                                    </span>
                                    <div className="text-gray-500 font-bold uppercase tracking-widest text-sm mt-1">
                                        Days Remaining
                                    </div>
                                </div>
                            )}
                            <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-3 bg-purple-50 p-3 rounded-xl border border-purple-100">
                                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                        <FaCrown />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-bold text-gray-800 text-sm">Padhaku Pro Features</h4>
                                        <p className="text-xs text-gray-500">Unlimited AI, Tests & Live Classes</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Link
                                    href="/pro"
                                    onClick={close}
                                    className="block w-full py-3.5 bg-gradient-to-r from-pw-indigo to-pw-violet text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                >
                                    <FaRocket />
                                    Upgrade to Pro Now
                                </Link>
                                <button
                                    onClick={close}
                                    className="text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
                                >
                                    Maybe later
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
