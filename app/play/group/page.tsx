'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUsers, FaPlay, FaWifi, FaArrowLeft, FaChevronRight } from 'react-icons/fa';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';

export default function GroupPlayPage() {
    const router = useRouter();
    const { checkAccess } = useAuth();
    const [joinCode, setJoinCode] = useState('');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const handleHostClick = () => {
        if (checkAccess('group_play')) {
            router.push('/play/group/host');
        } else {
            setShowUpgradeModal(true);
        }
    };

    const handleJoin = () => {
        if (joinCode.length === 6) {
            router.push(`/play/group/lobby/${joinCode}`);
        }
    };

    return (
        <div className="min-h-screen bg-pw-surface flex flex-col p-6 relative overflow-hidden font-sans">
            {/* Elegant Background - Smoother gradients */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pw-indigo/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pw-violet/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto w-full flex flex-col h-full">
                {/* Header */}
                <header className="flex justify-between items-center mb-16">
                    <Link href="/home" className="group flex items-center gap-2 text-gray-500 hover:text-pw-indigo font-medium transition-colors px-4 py-2 rounded-full hover:bg-white border border-transparent hover:border-pw-border hover:shadow-sm">
                        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                        <span>Dashboard</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-2 text-sm font-bold text-pw-indigo bg-white border border-pw-border px-4 py-2 rounded-full shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        LIVE MULTIPLAYER
                    </div>
                </header>

                <div className="flex-1 flex flex-col justify-center">
                    <div className="text-center mb-16">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-5xl lg:text-7xl font-display font-black text-pw-violet mb-6 tracking-tight"
                        >
                            Play with <span className="text-transparent bg-clip-text bg-gradient-to-r from-pw-indigo to-pw-violet">Friends</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed"
                        >
                            Compete in real-time. Host your own squad or join an existing battle.
                        </motion.p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
                        {/* HOST Option */}
                        <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            onClick={handleHostClick}
                            className="group relative bg-white hover:bg-gradient-to-br hover:from-pw-indigo hover:to-pw-violet border border-pw-border hover:border-pw-indigo/20 p-8 rounded-[2rem] text-left shadow-pw-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row items-center md:items-start gap-6 overflow-hidden"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-pw-surface border border-pw-border flex items-center justify-center text-2xl text-pw-indigo group-hover:bg-white/20 group-hover:text-white group-hover:border-white/20 transition-colors shrink-0">
                                <FaWifi />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-pw-violet group-hover:text-white mb-2 transition-colors">Host a Squad</h3>
                                <p className="text-gray-500 group-hover:text-pw-lavender transition-colors leading-relaxed">Create a room and challenge your friends.</p>
                            </div>
                            <div className="w-10 h-10 rounded-full border-2 border-pw-border group-hover:border-white/30 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors self-center">
                                <FaChevronRight />
                            </div>
                        </motion.button>

                        {/* JOIN Option */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="relative bg-white border border-pw-border p-8 rounded-[2rem] shadow-pw-lg flex flex-col gap-6"
                        >
                            <div className="flex items-start gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-2xl text-green-600 shrink-0">
                                    <FaUsers />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-pw-violet mb-2">Join a Squad</h3>
                                    <p className="text-gray-500 leading-relaxed">Enter the 6-digit code to enter.</p>
                                </div>
                            </div>

                            <div className="relative mt-2">
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="000 000"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-pw-surface border-2 border-transparent focus:border-pw-indigo focus:bg-white text-center text-2xl font-mono font-bold tracking-[0.5em] rounded-xl py-4 transition-all outline-none placeholder-gray-300 text-pw-violet"
                                />
                                <AnimatePresence>
                                    {joinCode.length === 6 && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            onClick={handleJoin}
                                            className="absolute right-2 top-2 bottom-2 aspect-square bg-pw-indigo text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-pw-violet transition-colors"
                                        >
                                            <FaPlay size={14} />
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                featureName="Multiplayer Hosting"
            />
        </div>
    );
}
