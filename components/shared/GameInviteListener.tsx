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

    const handleAccept = async () => {
        if (!currentInvite) return;
        const roomId = currentInvite.roomId;
        const inviteId = currentInvite.id;

        // Clear invite
        await clearGameInvite(inviteId);
        setCurrentInvite(null);

        // Navigate to lobby
        router.push(`/play/group/lobby/${roomId}`);
    };

    const handleReject = async () => {
        if (!currentInvite) return;
        await clearGameInvite(currentInvite.id);
        setCurrentInvite(null);
    };

    if (!currentInvite) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -50, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: -50, x: '-50%' }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-sm md:right-4 md:left-auto md:translate-x-0"
            >
                <div className="bg-white/95 backdrop-blur-md border border-pw-border shadow-pw-lg rounded-2xl p-4 flex items-center gap-3 md:gap-4 relative overflow-hidden">
                    {/* Progress Bar */}
                    <motion.div
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: 60, ease: 'linear' }}
                        className="absolute bottom-0 left-0 h-1 bg-pw-indigo"
                    />

                    <div className="relative shrink-0">
                        <img
                            src={currentInvite.fromPhoto || `https://ui-avatars.com/api/?name=${currentInvite.fromName}`}
                            className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-white shadow-sm bg-gray-100"
                            alt="inviter"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-pw-indigo text-white rounded-full p-1 border-2 border-white">
                            <FaGamepad size={12} />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-pw-violet truncate text-sm md:text-base">{currentInvite.fromName}</h4>
                        <p className="text-xs text-pw-indigo/80 font-medium truncate">is challenging you! ⚔️</p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={handleAccept}
                            className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-md transition-transform active:scale-95 flex items-center justify-center"
                            title="Accept"
                        >
                            <FaCheck size={16} />
                        </button>
                        <button
                            onClick={handleReject}
                            className="bg-red-100 hover:bg-red-200 text-red-500 p-3 rounded-full shadow-sm transition-transform active:scale-95 flex items-center justify-center"
                            title="Decline"
                        >
                            <FaTimes size={16} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
