'use client'

import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { motion } from 'framer-motion'
import { FaStar, FaRocket, FaUserFriends } from 'react-icons/fa'
import { useState } from 'react'
import { FriendsDrawer } from './FriendsDrawer'
import { useRouter } from 'next/navigation'
import { useFriends } from '@/hooks/useFriends'
import { createEmptyRoom } from '@/utils/roomService'

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

    const timeOfDay = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'
    const emoji = new Date().getHours() < 12 ? '🌅' : new Date().getHours() < 18 ? '☀️' : '🌙'

    // Hooks for instant play
    const { sendGameInvite } = useFriends()
    const router = useRouter()
    const [inviteLoading, setInviteLoading] = useState(false)

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
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full p-[3px] bg-gradient-to-tr from-pw-lavender via-pw-indigo to-pw-violet shadow-pw-md">
                            <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-pw-surface">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-pw-lavender/30 text-pw-violet font-bold text-xl">
                                        {(user?.displayName || 'U')[0]}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
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
                    <button
                        onClick={() => setIsFriendsOpen(true)}
                        className="relative p-2.5 bg-pw-surface text-pw-indigo rounded-full hover:bg-pw-lavender/20 transition-colors border border-pw-border shadow-pw-sm"
                    >
                        <FaUserFriends className="text-xl" />
                    </button>
                    {/* Actions or Notifications can go here later */}
                </div>
            </motion.div>

            <FriendsDrawer
                isOpen={isFriendsOpen}
                onClose={() => setIsFriendsOpen(false)}
                onPlayWithFriend={handlePlayWithFriend}
                inviteLoading={inviteLoading}
            />
        </div>
    )
}

