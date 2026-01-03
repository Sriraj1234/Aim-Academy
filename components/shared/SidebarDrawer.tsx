'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaMoon, FaWifi, FaGraduationCap, FaFileAlt, FaShoppingCart, FaBolt, FaHandsHelping, FaBook, FaLaptopCode, FaDesktop, FaBookOpen, FaDownload, FaShareAlt, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Button } from './Button';

interface SidebarDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({ isOpen, onClose }) => {
    const { user, logout, userProfile } = useAuth();

    const menuItems = [
        { icon: FaDesktop, label: 'Dashboard', href: '/home' },
        { icon: FaBookOpen, label: 'Study Hub', href: '/study-hub' },
        { icon: FaLaptopCode, label: 'Practice Zone', href: '/play/selection' },
        { icon: FaUserCircle, label: 'My Profile', href: '/profile' },
        { icon: FaBolt, label: 'AI Tools', isDivider: true },
        { icon: FaShareAlt, label: 'Snap & Solve', href: '/play/snap-solve' },
        { icon: FaBook, label: 'Wisdom Book', href: '/wisdom', isNew: true },
        { icon: FaHandsHelping, label: 'AI Guru', href: '/live-guru' },
        { icon: FaGraduationCap, label: 'Leaderboard', href: '/leaderboard' },
        { icon: FaMoon, label: 'Settings', isDivider: true },
        { icon: FaMoon, label: 'Dark Mode', isToggle: true },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { x: -20, opacity: 0 },
        show: { x: 0, opacity: 1 }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[70] shadow-2xl overflow-y-auto"
                    >
                        {/* Header Section */}
                        <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-indigo-50 to-white">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md">
                                    {user?.photoURL ? (
                                        <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-500 text-2xl">
                                            <FaUserCircle />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-800 text-lg leading-tight truncate">
                                        {user?.displayName || 'Scholar'}
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-1">
                                        {userProfile?.class ? `Class ${userProfile.class}` : 'Student'}
                                    </p>
                                    <Link href="/profile" onClick={onClose} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                                        View Profile <span>→</span>
                                    </Link>
                                </div>
                            </div>
                            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1">
                                <FaTimes />
                            </button>
                        </div>

                        {/* My Purchases / Quick Stats (Optional "Real" feel) */}
                        <div className="p-4">
                            <div className="bg-indigo-50/50 rounded-xl p-3 flex items-center gap-3 border border-indigo-100/50 cursor-pointer hover:bg-indigo-50 transition-colors">
                                <div className="bg-white p-2 rounded-lg text-indigo-600 shadow-sm">
                                    <FaShoppingCart />
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-800 text-sm block">My Purchases</span>
                                    <span className="text-xs text-gray-500">View your subscriptions</span>
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <motion.div
                            className="px-4 pb-20 space-y-1"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                        >
                            {menuItems.map((item, idx) => (
                                <React.Fragment key={idx}>
                                    {item.isDivider ? (
                                        <motion.div variants={itemVariants} className="pt-4 pb-2 px-2">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.label}</span>
                                        </motion.div>
                                    ) : (
                                        item.href ? (
                                            <Link href={item.href} onClick={onClose}>
                                                <motion.div
                                                    variants={itemVariants}
                                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50/50 cursor-pointer group transition-all duration-200 border border-transparent hover:border-indigo-100"
                                                >
                                                    <div className="flex items-center gap-4 text-gray-600 group-hover:text-indigo-600 transition-colors">
                                                        <span className="text-lg opacity-70 group-hover:opacity-100 transition-opacity"><item.icon /></span>
                                                        <span className="text-sm font-medium">{item.label}</span>
                                                    </div>
                                                </motion.div>
                                            </Link>
                                        ) : (
                                            <motion.div
                                                variants={itemVariants}
                                                className="flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50/50 cursor-pointer group transition-all duration-200 border border-transparent hover:border-indigo-100"
                                            >
                                                <div className="flex items-center gap-4 text-gray-600 group-hover:text-indigo-600 transition-colors">
                                                    <span className="text-lg opacity-70 group-hover:opacity-100 transition-opacity"><item.icon /></span>
                                                    <span className="text-sm font-medium">{item.label}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {item.isToggle && (
                                                        <div className="w-9 h-5 bg-gray-200 rounded-full relative transition-colors group-hover:bg-gray-300">
                                                            <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )
                                    )}
                                </React.Fragment>
                            ))}

                            {/* Logout Button */}
                            <motion.div variants={itemVariants} className="pt-6 px-2">
                                <Button variant="outline" className="w-full justify-start gap-3 hover:bg-red-50 hover:text-red-600 hover:border-red-100 group py-6" onClick={() => { onClose(); logout(); }}>
                                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                                        <FaShareAlt className="rotate-180" />
                                    </div>
                                    <span className="font-medium">Sign Out</span>
                                </Button>
                            </motion.div>
                        </motion.div>

                        {/* Bottom Upgrade Banner (Mock) */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-500">
                                    v 1.0.0
                                </div>
                                <div className="flex gap-4 text-gray-400 text-lg">
                                    {/* Social Icons Mock */}
                                </div>
                            </div>
                        </div>

                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
