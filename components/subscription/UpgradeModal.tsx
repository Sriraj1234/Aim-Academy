'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FaCrown, FaCheck, FaTimes } from 'react-icons/fa';
import Link from 'next/link';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    featureName: string; // e.g., "AI Chat" or "Flashcards"
}

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

export const UpgradeModal = ({ isOpen, onClose, featureName }: UpgradeModalProps) => {
    // Handling SSR: we need to wait for client mount to access document
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm pointer-events-auto"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative pointer-events-auto"
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-10"
                            >
                                <FaTimes className="text-gray-500" />
                            </button>

                            {/* Header Image/Icon */}
                            <div className="bg-gradient-to-br from-yellow-100 to-amber-100 p-8 flex justify-center pb-12 rounded-b-[40%] relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10"></div>
                                <div className="bg-gradient-to-br from-yellow-400 to-amber-500 w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 relative z-10">
                                    <FaCrown className="text-4xl text-white drop-shadow-md" />
                                </div>
                            </div>

                            <div className="px-6 pb-6 pt-2 text-center">
                                <h2 className="text-2xl font-black text-gray-900 mb-2 font-display">
                                    Unlock Padhaku <span className="text-amber-500">PRO</span>
                                </h2>
                                <p className="text-gray-600 mb-6 text-sm">
                                    You've reached your daily limit for <b>{featureName}</b>.
                                    Upgrade now to remove all limits!
                                </p>

                                {/* Benefits List */}
                                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                            <FaCheck className="text-green-600 text-[10px]" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">Unlimited AI Chat & Tools</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                            <FaCheck className="text-green-600 text-[10px]" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">Ad-Free Experience</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                            <FaCheck className="text-green-600 text-[10px]" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">Exclusive Pro Badge</span>
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <Link href="/pro" onClick={onClose}>
                                    <button className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold shadow-xl shadow-gray-200 transaction-all flex items-center justify-center gap-2 group">
                                        <FaCrown className="text-yellow-400 group-hover:scale-110 transition-transform" />
                                        Upgrade for ₹39/mo
                                    </button>
                                </Link>

                                <button
                                    onClick={onClose}
                                    className="mt-4 text-xs font-bold text-gray-400 hover:text-gray-600"
                                >
                                    Maybe later
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};
