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
                className="fixed top-4 left-1/2 z-[100] w-full max-w-sm"
            >
                <div className="bg-white/90 backdrop-blur-md border border-brand-100 shadow-2xl rounded-2xl p-4 mx-4 flex items-center gap-4">
                    <div className="relative">
                        <img
                            src={currentInvite.fromPhoto || `https://ui-avatars.com/api/?name=${currentInvite.fromName}`}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                            alt="inviter"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-brand-500 text-white rounded-full p-1">
                            <FaGamepad size={10} />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 truncate">{currentInvite.fromName}</h4>
                        <p className="text-xs text-gray-500">invited you to play!</p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleAccept}
                            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full shadow-sm transition-colors"
                            title="Accept"
                        >
                            <FaCheck size={14} />
                        </button>
                        <button
                            onClick={handleReject}
                            className="bg-red-100 hover:bg-red-200 text-red-500 p-2 rounded-full shadow-sm transition-colors"
                            title="Decline"
                        >
                            <FaTimes size={14} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
