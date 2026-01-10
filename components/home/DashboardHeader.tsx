'use client'

import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { motion } from 'framer-motion'
import { FaStar, FaRocket, FaUserFriends, FaBell, FaGift, FaShareAlt, FaCopy, FaCheck, FaWhatsapp, FaTelegram, FaTimes, FaBookReader, FaShieldAlt } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import { FriendsDrawer } from './FriendsDrawer'
import { NotificationsDrawer } from './NotificationsDrawer'
import { UserBadge } from '@/components/shared/UserBadge'
import { useRouter } from 'next/navigation'
import { useFriends } from '@/hooks/useFriends'
import { createEmptyRoom } from '@/utils/roomService'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'

const motivationalQuotes = [
    "Aaj ka goal: Apne aap se kal behtar bano! 🎯",
    "Har sawaal jiska tu jawab deta hai, success ke ek kadam aur paas! 💪",
    "Champions kabhi practice nahi chodte! 🏆",
    "Thoda aur push karo, tu kar sakta hai! 🚀",
    "Consistency is the key to success! 🔑"
]

export const DashboardHeader = () => {
    const { user, userProfile } = useAuth()
    const { t } = useLanguage()
    const [isFriendsOpen, setIsFriendsOpen] = useState(false)
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
    const [isReferralOpen, setIsReferralOpen] = useState(false)
    const [copied, setCopied] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)

    const timeOfDay = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'
    const emoji = new Date().getHours() < 12 ? '🌅' : new Date().getHours() < 18 ? '☀️' : '🌙'

    // Hooks for instant play
    const { sendGameInvite, requests } = useFriends()
    const router = useRouter()
    const [inviteLoading, setInviteLoading] = useState(false)

    // Filter incoming requests
    const incomingRequests = requests.filter(r => r.direction === 'received')

    // Fetch unread notifications count
    useEffect(() => {
        if (!user?.uid) return;

        const notificationsRef = collection(db, 'notifications');
        const q = query(
            notificationsRef,
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let count = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                // Count as unread if user is NOT in readBy array
                if (!data.readBy?.includes(user.uid)) {
                    count++;
                }
            });
            setUnreadCount(count);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const handlePlayWithFriend = async (friend: any) => {
        if (!user) return;
        setInviteLoading(true);
        try {
            // 1. Create Empty Room
            const { roomId } = await createEmptyRoom(user.displayName || 'Host', user.uid, user.photoURL || undefined);

            // 2. Set Local Storage Logic (Host)
            localStorage.setItem(`room_host_${roomId}`, 'true');
            localStorage.setItem(`player_name_${roomId}`, user.displayName || 'Host');
            localStorage.setItem(`player_id_${roomId}`, user.uid);

            // 3. Send Invite
            await sendGameInvite(friend.uid, roomId);

            // 4. Redirect to Lobby
            router.push(`/play/group/lobby/${roomId}`);
            setIsFriendsOpen(false);
        } catch (e) {
            console.error(e);
            alert("Failed to start game session.");
        } finally {
            setInviteLoading(false);
        }
    }

    return (
        <div className="mb-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div className="flex items-center gap-4">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="relative"
                    >
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full p-[3px] bg-gradient-to-tr from-pw-lavender via-pw-indigo to-pw-violet shadow-pw-md relative">
                            <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-pw-surface">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-pw-lavender/30 text-pw-violet font-bold text-xl">
                                        {(user?.displayName || 'U')[0]}
                                    </div>
                                )}
                            </div>
                            <UserBadge size="md" className="md:w-auto md:h-auto" userProfile={userProfile} showDefault={true} />
                        </div>
                    </motion.div>

                    <div>
                        <p className="text-pw-indigo text-sm font-medium flex items-center gap-1">
                            {timeOfDay} {emoji}
                        </p>
                        <h2 className="text-xl md:text-2xl font-bold text-pw-violet leading-tight">
                            {user?.displayName || 'Scholar'}
                        </h2>
                    </div>
                </div>

                <div className="flex gap-3">
                    {/* Referral Button */}
                    <button
                        onClick={() => setIsReferralOpen(true)}
                        className="relative p-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full hover:from-amber-500 hover:to-orange-600 transition-all border border-amber-300 shadow-pw-sm group"
                        title="Refer & Earn"
                    >
                        <FaGift className="text-xl group-hover:scale-110 transition-transform" />
                    </button>

                    <button
                        onClick={() => {
                            const element = document.getElementById('study-modes');
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }}
                        className="relative p-2.5 bg-pw-surface text-pw-indigo rounded-full hover:bg-pw-lavender/20 transition-colors border border-pw-border shadow-pw-sm group"
                        title="Go to Study Modes"
                    >
                        <FaBookReader className="text-xl group-hover:scale-110 transition-transform" />
                    </button>

                    <button
                        onClick={() => setIsNotificationsOpen(true)}
                        className="relative p-2.5 bg-pw-surface text-pw-indigo rounded-full hover:bg-pw-lavender/20 transition-colors border border-pw-border shadow-pw-sm group"
                    >
                        <FaBell className="text-xl group-hover:scale-110 transition-transform" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse shadow-sm">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setIsFriendsOpen(true)}
                        className="relative p-2.5 bg-pw-surface text-pw-indigo rounded-full hover:bg-pw-lavender/20 transition-colors border border-pw-border shadow-pw-sm"
                    >
                        <FaUserFriends className="text-xl" />
                        {incomingRequests.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse shadow-sm">
                                {incomingRequests.length}
                            </span>
                        )}
                    </button>
                </div>
            </motion.div>

            <FriendsDrawer
                isOpen={isFriendsOpen}
                onClose={() => setIsFriendsOpen(false)}
                onPlayWithFriend={handlePlayWithFriend}
                inviteLoading={inviteLoading}
            />

            <NotificationsDrawer
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
            />

            {/* Referral Modal */}
            {isReferralOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => setIsReferralOpen(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-pw-violet flex items-center gap-2">
                                <FaGift className="text-amber-500" /> Refer & Earn
                            </h3>
                            <button
                                onClick={() => setIsReferralOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <FaTimes className="text-gray-500" />
                            </button>
                        </div>

                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4">
                            <p className="text-sm text-gray-600 mb-2">🎁 Apne dost ko invite karo aur dono ko milega:</p>
                            <div className="flex justify-around text-center">
                                <div>
                                    <p className="font-bold text-2xl text-amber-600">50 XP</p>
                                    <p className="text-xs text-gray-500">Aapko</p>
                                </div>
                                <div className="w-px bg-amber-200"></div>
                                <div>
                                    <p className="font-bold text-2xl text-green-600">🎉 Bonus</p>
                                    <p className="text-xs text-gray-500">Dost ko</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-2">Tumhara Referral Link:</p>
                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-3 border">
                                <input
                                    type="text"
                                    readOnly
                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${user?.uid || ''}`}
                                    className="flex-1 bg-transparent text-sm text-gray-700 outline-none truncate"
                                />
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}?ref=${user?.uid || ''}`);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-500 text-white' : 'bg-pw-violet text-white hover:bg-pw-indigo'}`}
                                >
                                    {copied ? <FaCheck /> : <FaCopy />}
                                </button>
                            </div>
                            {copied && <p className="text-green-600 text-xs mt-1">✓ Link copied!</p>}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    const msg = `🎯 AIM Academy par padho aur top karo! Mere saath join karo aur special bonus pao! 🎁\n\n${window.location.origin}?ref=${user?.uid || ''}`;
                                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                                }}
                                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                            >
                                <FaWhatsapp className="text-xl" /> WhatsApp
                            </button>
                            <button
                                onClick={() => {
                                    const msg = `🎯 AIM Academy par padho aur top karo! Mere saath join karo aur special bonus pao! 🎁\n\n${window.location.origin}?ref=${user?.uid || ''}`;
                                    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin + '?ref=' + (user?.uid || ''))}&text=${encodeURIComponent(msg)}`, '_blank');
                                }}
                                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                            >
                                <FaTelegram className="text-xl" /> Telegram
                            </button>
                        </div>

                        {userProfile?.referralCount !== undefined && userProfile.referralCount > 0 && (
                            <div className="mt-4 text-center p-3 bg-purple-50 rounded-xl border border-purple-200">
                                <p className="text-sm text-gray-600">
                                    🏆 Tumne <span className="font-bold text-pw-violet">{userProfile.referralCount}</span> dost invite kiye!
                                </p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </div>
    )
}

