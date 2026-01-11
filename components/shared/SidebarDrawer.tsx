

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaMoon, FaWifi, FaGraduationCap, FaFileAlt, FaShoppingCart, FaBolt, FaHandsHelping, FaBook, FaLaptopCode, FaDesktop, FaBookOpen, FaDownload, FaShareAlt, FaUserCircle, FaGem, FaCamera, FaLightbulb, FaPaperPlane, FaInfoCircle, FaHeadset, FaShieldAlt, FaChalkboardTeacher, FaComments } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './Button';


interface SidebarDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({ isOpen, onClose }) => {
    const { user, logout, userProfile } = useAuth();
    const { theme, toggleTheme, resolvedTheme } = useTheme();
    const pathname = usePathname();
    const [isRequestOpen, setIsRequestOpen] = useState(false);

    const menuItems = [
        { icon: FaDesktop, label: 'Dashboard', href: '/home' },
        { icon: FaBookOpen, label: 'Study Hub', href: '/study-hub' },
        { icon: FaLaptopCode, label: 'Practice Zone', href: '/play/selection' },
        { icon: FaUserCircle, label: 'My Profile', href: '/profile' },
        { icon: FaBolt, label: 'AI Tools', isDivider: true },
        { icon: FaCamera, label: 'Snap & Solve', href: '/play/snap-solve' },
        { icon: FaBook, label: 'Wisdom Book', href: '/wisdom', isNew: true },
        { icon: FaHandsHelping, label: 'AI Guru', href: '/live-guru' },
        { icon: FaGraduationCap, label: 'Leaderboard', href: '/leaderboard' },
        { icon: FaComments, label: 'Discussions', href: '/discussions', isNew: true },
        { icon: FaChalkboardTeacher, label: 'Teacher Panel', href: '/teachers/admin' },
        { icon: FaMoon, label: 'Settings', isDivider: true },
        { icon: FaLightbulb, label: 'Request Feature', action: () => setIsRequestOpen(true) },
        { icon: FaMoon, label: 'Dark Mode', isToggle: true, action: toggleTheme },
        { icon: FaInfoCircle, label: 'About Us', href: '/about' },
        { icon: FaHeadset, label: 'Contact Support', href: '/contact' },
        { icon: FaShieldAlt, label: 'Policies', href: '/privacy' },
    ];

    const sidebarVariants: any = {
        hidden: {
            x: '-100%',
            transition: { type: 'spring', damping: 25, stiffness: 300 }
        },
        show: {
            x: 0,
            transition: { type: 'spring', damping: 30, stiffness: 300, staggerChildren: 0.05, delayChildren: 0.1 }
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
                    {/* Glassmorphism Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />

                    {/* Premium Sidebar */}
                    <motion.div
                        variants={sidebarVariants}
                        initial="hidden"
                        animate="show"
                        exit="hidden"
                        className={`fixed top-0 left-0 bottom-0 w-[85vw] sm:w-[300px] backdrop-blur-2xl z-[70] shadow-2xl border-r flex flex-col ${resolvedTheme === 'dark' ? 'bg-gray-900/95 border-gray-800' : 'bg-white/90 border-white/40'}`}
                    >
                        {/* Vibrant Header with Gradient */}
                        <div className="relative p-5 sm:p-6 pt-12 pb-8 overflow-hidden">
                            {/* Decorative Background Mesh */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 z-0" />
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-5 -mb-5" />

                            <div className="relative z-10 flex items-center gap-4">
                                <Link href="/profile" onClick={onClose} className="group relative">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-[3px] border-white/30 shadow-lg group-hover:scale-105 transition-transform duration-300">
                                        {user?.photoURL ? (
                                            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-3xl">
                                                <FaUserCircle />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-green-400 w-4 h-4 rounded-full border-2 border-indigo-600 shadow-sm" />
                                </Link>

                                <div className="flex-1 min-w-0 text-white">
                                    <h3 className="font-bold text-xl leading-tight truncate tracking-tight">
                                        {user?.displayName || 'Future Scholar'}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1 opacity-90">
                                        <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full font-medium border border-white/10">
                                            {userProfile?.class ? `Class ${userProfile.class}` : 'Student'}
                                        </span>
                                        {/* Mock Level/XP */}
                                        <span className="text-xs flex items-center gap-1">
                                            <FaGem className="text-yellow-300 text-[10px]" />
                                            Lvl {userProfile?.gamification?.level || 1}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                            <div className="px-4 space-y-1">
                                {menuItems.map((item: any, idx) => (
                                    <React.Fragment key={idx}>
                                        {item.isDivider ? (
                                            <motion.div variants={itemVariants} className="mt-6 mb-2 px-3">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-indigo-400/80'}`}>
                                                    {item.label}
                                                </span>
                                            </motion.div>
                                        ) : (
                                            item.href ? (
                                                <Link href={item.href} onClick={onClose}>
                                                    <motion.div
                                                        variants={itemVariants}
                                                        className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer group transition-all duration-300 ${pathname === item.href
                                                            ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-indigo-500 font-semibold shadow-inner'
                                                            : resolvedTheme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <span className={`text-xl transition-transform duration-300 group-hover:scale-110 ${pathname === item.href ? 'text-indigo-500 drop-shadow-sm' : resolvedTheme === 'dark' ? 'text-gray-500 group-hover:text-indigo-400' : 'text-gray-400 group-hover:text-indigo-500'
                                                                }`}>
                                                                <item.icon />
                                                            </span>

                                                            <span className="text-sm tracking-wide">{item.label}</span>
                                                        </div>

                                                        {item.isNew && (
                                                            <span className="text-[9px] font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                                                                NEW
                                                            </span>
                                                        )}
                                                        {pathname === item.href && (
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                        )}
                                                    </motion.div>
                                                </Link>
                                            ) : (
                                                <motion.div
                                                    onClick={item.action}
                                                    variants={itemVariants}
                                                    className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer group transition-all duration-200 ${resolvedTheme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <span className={`text-xl transition-colors ${resolvedTheme === 'dark' ? 'text-gray-500 group-hover:text-indigo-400' : 'text-gray-400 group-hover:text-indigo-500'
                                                            }`}><item.icon /></span>
                                                        <span className="text-sm font-medium">{item.label}</span>
                                                    </div>
                                                    {item.isToggle && (
                                                        <div className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${resolvedTheme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200 group-hover:bg-gray-300'
                                                            }`}>
                                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${resolvedTheme === 'dark' ? 'left-5' : 'left-1'
                                                                }`} />
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* CTA / Upgrade Box */}
                            <motion.div variants={itemVariants} className="mx-4 mt-6 p-4 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -mr-6 -mt-6 transition-transform group-hover:scale-150 duration-700" />
                                <div className="relative z-10">
                                    <h4 className="font-bold text-sm mb-1">Unlock Premium 🚀</h4>
                                    <p className="text-xs text-gray-300 mb-3 leading-relaxed">Get unlimited AI doubts, ad-free learning, and exclusive notes.</p>
                                    <button className="w-full py-2 bg-white text-gray-900 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors">
                                        View Plans
                                    </button>
                                </div>
                            </motion.div>

                            {/* Sign Out */}
                            <motion.div variants={itemVariants} className="p-4 mt-2">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50/80 rounded-xl h-12"
                                    onClick={() => { onClose(); logout(); }}
                                >
                                    <FaShareAlt className="rotate-180" />
                                    <span className="font-medium">Sign Out</span>
                                </Button>
                                <div className="mt-4 text-center">
                                    <p className="text-[10px] text-gray-400 font-medium">Padhaku v1.2.0 • Made with ❤️</p>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Request Feature Modal */}
                    <AnimatePresence>
                        {isRequestOpen && (
                            <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsRequestOpen(false)}
                                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                />
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                    className={`relative w-full max-w-sm rounded-2xl p-6 shadow-2xl ${resolvedTheme === 'dark' ? 'bg-gray-900 border border-gray-800 text-white' : 'bg-white text-gray-900'}`}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg">
                                            <FaLightbulb />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">Request Feature</h3>
                                            <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Help us improve Padhaku</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1.5 block">What's on your mind?</label>
                                            <textarea
                                                className={`w-full h-24 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none ${resolvedTheme === 'dark' ? 'bg-gray-800 text-white placeholder-gray-500' : 'bg-gray-50 text-gray-900 placeholder-gray-400 border-gray-100'}`}
                                                placeholder="I wish Padhaku had..."
                                            />
                                        </div>
                                        <Button className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30" onClick={() => setIsRequestOpen(false)}>
                                            <FaPaperPlane />
                                            Submit Request
                                        </Button>
                                    </div>

                                    <button onClick={() => setIsRequestOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-500">
                                        <FaTimes />
                                    </button>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    );
};

