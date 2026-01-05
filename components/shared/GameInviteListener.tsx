'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGamepad, FaCheck, FaTimes } from 'react-icons/fa';
import { useFriends } from '@/hooks/useFriends';

export const GameInviteListener = () => {
    const { activeInvites, clearGameInvite } = useFriends();
    const router = useRouter();
    const [currentInvite, setCurrentInvite] = useState<any>(null);
    const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'accepted' | 'declined'; text: string } | null>(null);

    useEffect(() => {
        // If we have invites and aren't showing one, show the first one
        if (activeInvites.length > 0 && !currentInvite) {
            setCurrentInvite(activeInvites[0]);
        }
        // If we have no invites, clear current
        else if (activeInvites.length === 0) {
            setCurrentInvite(null);
        }
    }, [activeInvites, currentInvite]);

    // Auto-clear feedback after 2 seconds
    useEffect(() => {
        if (!feedbackMessage) return;
        const timer = setTimeout(() => setFeedbackMessage(null), 2000);
        return () => clearTimeout(timer);
    }, [feedbackMessage]);

    const handleAccept = async () => {
        if (!currentInvite) return;

        // Check if already in a game/lobby
        const isInGame = window.location.pathname.includes('/play/group/');
        if (isInGame) {
            const confirmed = window.confirm("⚠️ You are already in a lobby!\n\nDo you want to LEAVE your current lobby to join this invite?");
            if (!confirmed) return;
        }

        const roomId = currentInvite.roomId;
        const inviteId = currentInvite.id;

        // Clear invite
        await clearGameInvite(inviteId);
        setCurrentInvite(null);
        setFeedbackMessage({ type: 'accepted', text: '✅ Invite Accepted!' });

        // Navigate to lobby
        router.push(`/play/group/lobby/${roomId}`);
    };

    const handleReject = async () => {
        if (!currentInvite) return;
        await clearGameInvite(currentInvite.id);
        setCurrentInvite(null);
        setFeedbackMessage({ type: 'declined', text: '❌ Invite Declined' });
    };

    useEffect(() => {
        if (!currentInvite) return;

        const timer = setTimeout(() => {
            handleReject();
        }, 10000); // 10 seconds auto-dismiss

        return () => clearTimeout(timer);
    }, [currentInvite]);

    // Show feedback toast if no invite but feedback exists
    if (!currentInvite && feedbackMessage) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-4 sm:pt-6 pointer-events-none"
                >
                    <div className={`px-4 py-3 rounded-xl shadow-lg font-semibold text-sm pointer-events-auto ${feedbackMessage.type === 'accepted'
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}>
                        {feedbackMessage.text}
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }

    if (!currentInvite) return null;

    return (
        <AnimatePresence>
            {/* Full-screen overlay container for centering */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-4 sm:pt-6 pointer-events-none"
            >
                {/* The actual popup card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/50 dark:border-slate-700 shadow-2xl rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 relative overflow-hidden ring-1 ring-black/5 pointer-events-auto w-full max-w-[calc(100vw-2rem)] sm:max-w-sm">
                    {/* Premium Progress Bar */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100">
                        <motion.div
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: 10, ease: 'linear' }} // 10s visual timer
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        />
                    </div>

                    <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-br from-indigo-500 to-purple-500">
                            <img
                                src={currentInvite.fromPhoto || `https://ui-avatars.com/api/?name=${currentInvite.fromName}`}
                                className="w-full h-full rounded-full object-cover border-2 border-white"
                                alt="inviter"
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm">
                            <div className="bg-indigo-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center">
                                <FaGamepad size={10} />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 truncate text-base">{currentInvite.fromName}</h4>
                        <p className="text-xs text-indigo-600 font-bold tracking-wide uppercase">Challenge Invite ⚔️</p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={handleReject}
                            className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 active:scale-90 transition-all border border-red-100"
                            title="Decline"
                        >
                            <FaTimes size={14} />
                        </button>
                        <button
                            onClick={handleAccept}
                            className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-200 hover:bg-indigo-600 active:scale-90 transition-all"
                            title="Accept"
                        >
                            <FaCheck size={14} />
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
