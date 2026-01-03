'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaTimes, FaCheck } from 'react-icons/fa';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationPromptProps {
    delay?: number; // Delay before showing (ms)
}

export const NotificationPrompt: React.FC<NotificationPromptProps> = ({ delay = 5000 }) => {
    const { permission, isSupported, requestPermission } = useNotifications();
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if user has already dismissed or granted permission
        if (!isSupported || permission === 'granted' || permission === 'denied') {
            return;
        }

        // Check localStorage for dismissal
        const wasDismissed = localStorage.getItem('notification_prompt_dismissed');
        if (wasDismissed) {
            return;
        }

        // Show prompt after delay
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, delay);

        return () => clearTimeout(timer);
    }, [isSupported, permission, delay]);

    const handleEnable = async () => {
        setIsLoading(true);
        const token = await requestPermission();
        setIsLoading(false);

        if (token) {
            setIsVisible(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        setDismissed(true);
        localStorage.setItem('notification_prompt_dismissed', 'true');
    };

    if (!isSupported || permission === 'granted' || dismissed) {
        return null;
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                >
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white relative">
                        <button
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors p-1"
                        >
                            <FaTimes className="text-sm" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <FaBell className="text-2xl" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Stay Updated! 🔔</h3>
                                <p className="text-sm text-white/80">Get notified about important stuff</p>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-4">
                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <FaCheck className="text-green-500 flex-shrink-0" />
                                <span>Daily motivation quotes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaCheck className="text-green-500 flex-shrink-0" />
                                <span>Streak reminders (don't break it!)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaCheck className="text-green-500 flex-shrink-0" />
                                <span>Friend requests & game invites</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaCheck className="text-green-500 flex-shrink-0" />
                                <span>Rank updates & achievements</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleDismiss}
                                className="flex-1 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Maybe Later
                            </button>
                            <button
                                onClick={handleEnable}
                                disabled={isLoading}
                                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <FaBell className="text-sm" />
                                        Enable
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
