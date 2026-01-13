'use client'

import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { motion } from 'framer-motion'
import { FaStar, FaRocket, FaUserFriends, FaBell, FaShareAlt, FaBookReader, FaShieldAlt } from 'react-icons/fa'
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
    const [unreadCount, setUnreadCount] = useState(0)

    const [greeting, setGreeting] = useState({ text: 'Good Morning', emoji: '🌅' })

    useEffect(() => {
        const hour = new Date().getHours()
        if (hour < 12) setGreeting({ text: 'Good Morning', emoji: '🌅' })
        else if (hour < 18) setGreeting({ text: 'Good Afternoon', emoji: '☀️' })
        else setGreeting({ text: 'Good Evening', emoji: '🌙' })
    }, [])

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
        <div className="mb-2 md:mb-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between gap-3 md:gap-4"
            >
                <div className="flex items-center gap-4 md:gap-6 min-w-0 flex-1">
                    {!user ? (
                        <div className="flex items-center gap-2">
                            <a href="/login" className="px-4 py-2 md:px-5 md:py-2.5 bg-pw-violet text-white font-bold rounded-xl shadow-pw-sm hover:shadow-pw-md transition-all active:scale-95 text-xs md:text-sm whitespace-nowrap">
                                Login
                            </a>
                            <a href="/signup" className="hidden md:block px-5 py-2.5 bg-white border border-pw-border text-pw-indigo font-bold rounded-xl hover:bg-gray-50 transition-all text-sm">
                                Sign Up
                            </a>
                        </div>
                    ) : (
                        <>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="relative shrink-0"
                            >
                                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full p-[2px] md:p-[3px] bg-gradient-to-tr from-pw-lavender via-pw-indigo to-pw-violet shadow-pw-md relative">
                                    <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-pw-surface">
                                        {user?.photoURL ? (
                                            <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-pw-lavender/30 text-pw-violet font-bold text-lg md:text-xl">
                                                {(user?.displayName || 'U')[0]}
                                            </div>
                                        )}
                                    </div>
                                    <UserBadge size="md" className="-bottom-1 -right-1 md:w-auto md:h-auto scale-75 md:scale-100 origin-top-left" userProfile={userProfile} showDefault={true} />
                                </div>
                            </motion.div>

                            <div className="min-w-0 flex-1 flex flex-col justify-center">
                                <p className="text-pw-indigo/80 text-xs md:text-sm font-medium flex items-center gap-1.5 mb-0.5" suppressHydrationWarning>
                                    {greeting.text} <span className="text-sm md:text-base">{greeting.emoji}</span>
                                </p>
                                <h2 className="text-xl md:text-2xl font-bold text-pw-violet leading-tight truncate tracking-tight">
                                    {user?.displayName || 'Scholar'}
                                </h2>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    {/* Notification Button */}
                    <button
                        onClick={() => setIsNotificationsOpen(true)}
                        className="relative w-9 h-9 md:w-11 md:h-11 grid place-items-center leading-none bg-pw-surface text-pw-indigo rounded-full hover:bg-pw-lavender/20 transition-colors border border-pw-border shadow-pw-sm group"
                    >
                        <FaBell className="text-lg md:text-xl group-hover:scale-110 transition-transform" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-[9px] md:text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse shadow-sm leading-normal">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Study Modes Button */}
                    <button
                        onClick={() => {
                            const element = document.getElementById('study-modes');
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }}
                        className="relative w-9 h-9 md:w-11 md:h-11 grid place-items-center leading-none bg-pw-surface text-pw-indigo rounded-full hover:bg-pw-lavender/20 transition-colors border border-pw-border shadow-pw-sm group"
                        title="Go to Study Modes"
                    >
                        <FaBookReader className="text-lg md:text-xl group-hover:scale-110 transition-transform" />
                    </button>

                    {/* Friends Button */}
                    <button
                        onClick={() => setIsFriendsOpen(true)}
                        className="relative w-9 h-9 md:w-11 md:h-11 grid place-items-center leading-none bg-pw-surface text-pw-indigo rounded-full hover:bg-pw-lavender/20 transition-colors border border-pw-border shadow-pw-sm"
                    >
                        <FaUserFriends className="text-lg md:text-xl" />
                        {incomingRequests.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-[9px] md:text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse shadow-sm leading-normal">
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


        </div>
    )
}

