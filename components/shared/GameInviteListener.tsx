'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGamepad, FaCheck, FaTimes, FaDoorOpen } from 'react-icons/fa';
import { useFriends } from '@/hooks/useFriends';

export const GameInviteListener = () => {
    const { activeInvites, sentInvites, respondToGameInvite, clearSentInvite } = useFriends();
    const router = useRouter();
    const [currentInvite, setCurrentInvite] = useState<any>(null);
    const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'accepted' | 'declined'; text: string } | null>(null);

    // ── NEW: two-step state ───────────────────────────────────────────────────
    // When user taps ✅ we show "Enter Lobby" confirmation UI first.
    // Only when they tap "Enter Lobby" do we mark it as accepted.
    const [confirmedInvite, setConfirmedInvite] = useState<any>(null);
    // ─────────────────────────────────────────────────────────────────────────

    // 1. Handle Incoming Invites
    useEffect(() => {
        if (activeInvites.length > 0 && !currentInvite && !confirmedInvite) {
            setCurrentInvite(activeInvites[0]);
        } else if (activeInvites.length === 0) {
            setCurrentInvite(null);
        }
    }, [activeInvites, currentInvite, confirmedInvite]);

    // 2. Handle SENT Invite Responses (only show notification to sender)
    useEffect(() => {
        sentInvites.forEach(invite => {
            if (invite.status === 'accepted') {
                setFeedbackMessage({ type: 'accepted', text: `✅ Friend ne lobby join kar li!` });
                // Do NOT auto-navigate sender — they are already in the lobby
                clearSentInvite(invite.id);
            } else if (invite.status === 'rejected') {
                setFeedbackMessage({ type: 'declined', text: `❌ Invite Declined` });
                clearSentInvite(invite.id);
            }
        });
    }, [sentInvites, clearSentInvite]);

    // Auto-clear feedback after 3 seconds
    useEffect(() => {
        if (!feedbackMessage) return;
        const timer = setTimeout(() => setFeedbackMessage(null), 3000);
        return () => clearTimeout(timer);
    }, [feedbackMessage]);

    // Step 1: user taps ✅ — show the "Enter Lobby" confirmation panel
    const handleConfirm = () => {
        if (!currentInvite) return;

        const isInGame = window.location.pathname.includes('/play/group/');
        if (isInGame) {
            const confirmed = window.confirm("⚠️ You are already in a lobby!\n\nDo you want to LEAVE your current lobby to join this invite?");
            if (!confirmed) return;
        }

        // Move to confirmed state — popup stays open showing "Enter Lobby"
        setConfirmedInvite(currentInvite);
        setCurrentInvite(null);
    };

    // Step 2: user taps "Enter Lobby" — NOW mark as accepted and navigate
    const handleEnterLobby = async () => {
        if (!confirmedInvite) return;

        const roomId = confirmedInvite.roomId;
        const inviteId = confirmedInvite.id;
        const senderUid = confirmedInvite.fromUid;

        // Only NOW notify the sender that invite was accepted
        await respondToGameInvite(inviteId, 'accepted', senderUid);

        setConfirmedInvite(null);
        setFeedbackMessage({ type: 'accepted', text: '✅ Joining Lobby...' });

        router.push(`/play/group/lobby/${roomId}`);
    };

    const handleReject = async () => {
        const invite = currentInvite || confirmedInvite;
        if (!invite) return;

        await respondToGameInvite(invite.id, 'rejected', invite.fromUid);
        setCurrentInvite(null);
        setConfirmedInvite(null);
        setFeedbackMessage({ type: 'declined', text: '❌ Invite Declined' });
    };

    // Auto-dismiss after 12s if they neither accept nor reject
    useEffect(() => {
        if (!currentInvite) return;
        const timer = setTimeout(() => {
            handleReject();
        }, 12000);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentInvite]);

    // ── Feedback Toast ────────────────────────────────────────────────────────
    if (!currentInvite && !confirmedInvite && feedbackMessage) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-4 sm:pt-6 pointer-events-none"
                >
                    <div className={`px-4 py-3 rounded-xl shadow-lg font-semibold text-sm pointer-events-auto flex items-center gap-2 ${feedbackMessage.type === 'accepted'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                        }`}>
                        {feedbackMessage.type === 'accepted' ? <FaCheck /> : <FaTimes />}
                        {feedbackMessage.text}
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }

    // ── Step 2 UI: "Enter Lobby" confirmation ─────────────────────────────────
    if (confirmedInvite) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-4 sm:pt-6 pointer-events-none"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-indigo-200 shadow-2xl rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden ring-1 ring-indigo-300/30 pointer-events-auto w-full max-w-[calc(100vw-2rem)] sm:max-w-sm"
                    >
                        {/* Friend Info */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-br from-indigo-500 to-purple-500 shrink-0">
                                <img
                                    src={confirmedInvite.fromPhoto || `https://ui-avatars.com/api/?name=${confirmedInvite.fromName}`}
                                    className="w-full h-full rounded-full object-cover border-2 border-white"
                                    alt="inviter"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-800 truncate">{confirmedInvite.fromName} ka invite</p>
                                <p className="text-xs text-indigo-500 font-mono">Room: {confirmedInvite.roomId}</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleReject}
                                className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 active:scale-95 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEnterLobby}
                                className="flex-1 py-2 rounded-xl bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
                            >
                                <FaDoorOpen size={14} />
                                Enter Lobby
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    if (!currentInvite) return null;

    // ── Step 1 UI: initial invite popup ──────────────────────────────────────
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-4 sm:pt-6 pointer-events-none"
            >
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
                            transition={{ duration: 10, ease: 'linear' }}
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
                        {/* ✅ Step 1: just confirm, don't mark accepted yet */}
                        <button
                            onClick={handleConfirm}
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
