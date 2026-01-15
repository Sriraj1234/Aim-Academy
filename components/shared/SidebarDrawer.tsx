import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { FaTimes, FaMoon, FaGraduationCap, FaBook, FaLaptopCode, FaDesktop, FaBookOpen, FaShareAlt, FaUserCircle, FaGem, FaCamera, FaLightbulb, FaPaperPlane, FaInfoCircle, FaHeadset, FaShieldAlt, FaChalkboardTeacher, FaComments, FaBolt, FaHandsHelping } from 'react-icons/fa';
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

    // Grouped Menu Structure
    const menuGroups = [
        {
            id: 'main',
            label: null, // No header for main section
            items: [
                { icon: FaDesktop, label: 'Dashboard', href: '/home' },
                { icon: FaUserCircle, label: 'My Profile', href: '/profile' },
                { icon: FaGraduationCap, label: 'Leaderboard', href: '/leaderboard' },
            ]
        },
        {
            id: 'ai-tools',
            label: 'AI Tools',
            items: [
                { icon: FaCamera, label: 'Snap & Solve', href: '/play/snap-solve' },
                { icon: FaBook, label: 'Wisdom Book', href: '/wisdom', isNew: true },
                { icon: FaHandsHelping, label: 'AI Guru', href: '/live-guru' },
            ]
        },
        {
            id: 'features',
            label: 'App Features',
            items: [
                { icon: FaBookOpen, label: 'Study Hub', href: '/study-hub' },
                { icon: FaLaptopCode, label: 'Practice Zone', href: '/play/selection' },
                { icon: FaComments, label: 'Discussions', href: '/discussions', isNew: true },
                { icon: FaChalkboardTeacher, label: 'Teacher Panel', href: '/teachers/admin' },
            ]
        },
        {
            id: 'settings',
            label: 'Settings & Support',
            items: [
                { icon: FaLightbulb, label: 'Request Feature', action: () => setIsRequestOpen(true) },
                { icon: FaMoon, label: 'Dark Mode', isToggle: true, action: toggleTheme },
                { icon: FaInfoCircle, label: 'About Us', href: '/about' },
                { icon: FaHeadset, label: 'Contact Support', href: '/contact' },
                { icon: FaShieldAlt, label: 'Policies', href: '/privacy' },
            ]
        }
    ];

    // Smooth Animation Curve (Spring Physics)
    const sidebarVariants: Variants = {
        hidden: {
            x: '-100%',
            opacity: 0.5,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 30
            }
        },
        show: {
            x: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
                staggerChildren: 0.05,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { x: -20, opacity: 0 },
        show: {
            x: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 25
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Glassmorphism Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-[6px] z-[60]"
                    />

                    {/* Premium Sidebar */}
                    <motion.div
                        variants={sidebarVariants}
                        initial="hidden"
                        animate="show"
                        exit="hidden"
                        className={`fixed top-0 left-0 bottom-0 w-[85vw] sm:w-[320px] backdrop-blur-3xl z-[70] shadow-[10px_0_40px_-5px_rgba(0,0,0,0.3)] border-r flex flex-col ${resolvedTheme === 'dark' ? 'bg-[#0a0a0f]/95 border-white/5' : 'bg-white/95 border-gray-100'}`}
                    >
                        {/* Vibrant Header with Gradient */}
                        <div className="relative p-6 pt-12 pb-8 overflow-hidden rounded-br-[32px] shadow-lg z-10 shrink-0">
                            {/* Decorative Background Mesh */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#DB2777] z-0" />
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -ml-5 -mb-5" />

                            <div className="relative z-10 flex items-center gap-4">
                                <Link href="/profile" onClick={onClose} className="group relative">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-[3px] border-white/40 shadow-xl group-hover:scale-105 transition-transform duration-300 bg-white/10 backdrop-blur-md">
                                        {user?.photoURL ? (
                                            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white text-3xl">
                                                <FaUserCircle />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 right-0 bg-[#22c55e] w-4 h-4 rounded-full border-[2.5px] border-[#5b50e6] shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                </Link>

                                <div className="flex-1 min-w-0 text-white">
                                    <h3 className="font-bold text-xl leading-snug truncate tracking-tight drop-shadow-sm">
                                        {user?.displayName || 'Future Scholar'}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1.5 opacity-90">
                                        <span className="text-[10px] uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full font-bold border border-white/20 shadow-sm">
                                            {userProfile?.class ? `Class ${userProfile.class}` : 'Student'}
                                        </span>
                                        {/* Mock Level/XP */}
                                        <span className="text-xs flex items-center gap-1 font-medium text-yellow-100">
                                            <FaGem className="text-yellow-300 text-[10px]" />
                                            Lvl {userProfile?.gamification?.level || 1}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-5 right-5 text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all duration-300"
                            >
                                <FaTimes className="text-lg" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
                            <div className="space-y-6">
                                {menuGroups.map((group) => (
                                    <div key={group.id}>
                                        {group.label && (
                                            <motion.div variants={itemVariants} className="px-3 mb-2 flex items-center gap-2">
                                                <span className={`text-[10px] font-extrabold uppercase tracking-widest ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-indigo-400/80'}`}>
                                                    {group.label}
                                                </span>
                                                <div className={`h-[1px] flex-1 ${resolvedTheme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`} />
                                            </motion.div>
                                        )}

                                        <div className="space-y-1">
                                            {group.items.map((item: any, idx) => (
                                                <React.Fragment key={`${group.id}-${idx}`}>
                                                    {item.href ? (
                                                        <Link href={item.href} onClick={onClose}>
                                                            <motion.div
                                                                variants={itemVariants}
                                                                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-all duration-300 border border-transparent ${pathname === item.href
                                                                    ? 'bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-transparent text-indigo-500 font-bold border-indigo-500/10 shadow-sm'
                                                                    : resolvedTheme === 'dark' ? 'text-gray-400 hover:bg-white/5 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`text-[1.1rem] w-6 flex justify-center transition-colors duration-300 filter ${pathname === item.href ? 'text-indigo-500' : 'opacity-70 group-hover:opacity-100 group-hover:text-indigo-500'
                                                                        }`}>
                                                                        <item.icon />
                                                                    </span>

                                                                    <span className="text-[13px] tracking-wide font-medium">{item.label}</span>
                                                                </div>

                                                                {item.isNew && (
                                                                    <span className="text-[9px] font-bold bg-gradient-to-r from-pink-500 to-rose-600 text-white px-2 py-0.5 rounded-full shadow-[0_2px_8px_rgba(244,63,94,0.4)]">
                                                                        NEW
                                                                    </span>
                                                                )}
                                                                {pathname === item.href && (
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                                                )}
                                                            </motion.div>
                                                        </Link>
                                                    ) : (
                                                        <motion.div
                                                            onClick={item.action}
                                                            variants={itemVariants}
                                                            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-all duration-200 ${resolvedTheme === 'dark' ? 'text-gray-400 hover:bg-white/5 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className={`text-[1.1rem] w-6 flex justify-center transition-colors duration-300 ${'opacity-70 group-hover:opacity-100 group-hover:text-indigo-500'}`}><item.icon /></span>
                                                                <span className="text-[13px] font-medium tracking-wide">{item.label}</span>
                                                            </div>
                                                            {item.isToggle && (
                                                                <div className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer border ${resolvedTheme === 'dark' ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-gray-200 border-gray-300'
                                                                    }`}>
                                                                    <div className={`absolute top-[2px] w-3.5 h-3.5 rounded-full shadow-md transition-all duration-300 ${resolvedTheme === 'dark' ? 'left-[20px] bg-indigo-400' : 'left-1 bg-white'
                                                                        }`} />
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* CTA / Upgrade Box */}
                            <motion.div variants={itemVariants} className="mx-2 mt-8 p-0 rounded-2xl bg-gradient-to-br from-[#0f0a1f] to-[#1e1b2e] border border-white/5 relative overflow-hidden group shadow-2xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative p-5 z-10">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white mb-3 shadow-lg">
                                        <FaGem />
                                    </div>
                                    <h4 className="font-bold text-white text-[15px] mb-1">Padhaku Pro 🚀</h4>
                                    <p className="text-xs text-gray-400 mb-4 leading-relaxed font-medium">Unlock unlimited AI doubts, ad-free experience & exclusive notes.</p>
                                    <button className="w-full py-2.5 bg-white hover:bg-gray-50 text-black rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95">
                                        View Premium Plans
                                    </button>
                                </div>
                            </motion.div>

                            {/* Sign Out */}
                            <motion.div variants={itemVariants} className="mt-4 px-2">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl h-11 border border-transparent hover:border-red-500/10"
                                    onClick={() => { onClose(); logout(); }}
                                >
                                    <FaShareAlt className="rotate-180" />
                                    <span className="font-medium text-sm">Sign Out</span>
                                </Button>
                                <div className="mt-6 text-center">
                                    <p className="text-[10px] text-gray-400/60 font-semibold tracking-wider font-mono uppercase">Padhaku v1.2.0 • Made with ❤️</p>
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
                                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                                    transition={{ type: "tween", duration: 0.2 }}
                                    className={`relative w-full max-w-sm rounded-3xl p-6 shadow-2xl border ${resolvedTheme === 'dark' ? 'bg-[#0f0a1f] border-white/10 text-white' : 'bg-white border-white text-gray-900'}`}
                                >
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xl">
                                            <FaLightbulb />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">Request Feature</h3>
                                            <p className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Help us improve Padhaku</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[11px] font-bold uppercase tracking-wider opacity-60 mb-2 block">What's on your mind?</label>
                                            <textarea
                                                className={`w-full h-28 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all ${resolvedTheme === 'dark' ? 'bg-white/5 text-white placeholder-white/20 border border-white/5' : 'bg-gray-50 text-gray-900 placeholder-gray-400 border-gray-100'}`}
                                                placeholder="I wish Padhaku had..."
                                            />
                                        </div>
                                        <Button className="w-full gap-2 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-500/20 rounded-xl font-bold" onClick={() => setIsRequestOpen(false)}>
                                            <FaPaperPlane />
                                            Submit Request
                                        </Button>
                                    </div>

                                    <button onClick={() => setIsRequestOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-500 transition-colors">
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
