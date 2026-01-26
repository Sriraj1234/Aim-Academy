'use client';

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaUserFriends, FaUserPlus, FaTimes, FaCheck, FaSearch, FaGamepad, FaEnvelope, FaShareAlt, FaCrown, FaFire } from 'react-icons/fa'
import { useFriends } from '@/hooks/useFriends'
import { useAuth } from '@/context/AuthContext'
import { useSound } from '@/hooks/useSound'
import { LocalStudentsSection } from '@/components/home/LocalStudentsSection'
import { UserBadge } from '@/components/shared/UserBadge'
import { SafeAvatar } from '@/components/shared/SafeAvatar'
import { Friend } from '@/data/types'

interface FriendsDrawerProps {
    isOpen: boolean
    onClose: () => void
    onInvite?: (friendUid: string) => void
    inviteLoading?: boolean
    onPlayWithFriend?: (friend: any) => void
}



const InviteButton = ({ friendUid, onInvite, loading }: { friendUid: string, onInvite: (uid: string) => void, loading?: boolean }) => {
    const [cooldown, setCooldown] = useState(0);

    // Initial check
    useEffect(() => {
        const checkCooldown = () => {
            const last = localStorage.getItem(`last_invite_${friendUid}`);
            if (last) {
                const diff = Date.now() - parseInt(last);
                if (diff < 10000) {
                    setCooldown(Math.ceil((10000 - diff) / 1000));
                } else {
                    setCooldown(0);
                }
            }
        };
        checkCooldown();
        const interval = setInterval(checkCooldown, 1000);
        return () => clearInterval(interval);
    }, [friendUid]);

    return (
        <button
            onClick={() => {
                if (cooldown > 0) return;
                onInvite(friendUid);
                // Optimistically start cooldown
                setCooldown(10);
            }}
            disabled={cooldown > 0 || loading}
            className={`p-2 rounded-lg border transition-all flex items-center justify-center w-9 h-9 ${cooldown > 0
                ? 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed'
                : 'bg-pw-surface dark:bg-slate-800 text-pw-indigo border-pw-border dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:border-pw-indigo hover:shadow-sm'
                }`}
            title="Send Invite"
        >
            {loading ? <span className="animate-spin text-xs">C</span> :
                cooldown > 0 ? <span className="text-[10px] font-bold">{cooldown}s</span> : <FaShareAlt />}
        </button>
    );
};

export const FriendsDrawer = ({ isOpen, onClose, onInvite, inviteLoading: externalInviteLoading, onPlayWithFriend }: FriendsDrawerProps) => {
    const { user, userProfile } = useAuth();
    const { friends, requests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, loading, onlineUsers } = useFriends()
    const { play } = useSound() // Sound effects
    const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'add'>('friends')
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [inviteLoading, setInviteLoading] = useState(false)

    // Filter only incoming requests for the badge/list
    const incomingRequests = requests.filter(r => r.direction === 'received')

    const handleSendRequest = async () => {
        if (!email) return
        setInviteLoading(true)
        setError('')
        setSuccess('')
        try {
            await sendFriendRequest(email)
            setSuccess('Request sent successfully!')
            setEmail('')
            play('success') // Success sound
        } catch (err: any) {
            setError(err.message || 'Failed to send request')
            play('wrong') // Error sound
        } finally {
            setInviteLoading(false)
        }
    }

    const handleAccept = async (uid: string) => {
        await acceptFriendRequest(uid)
        play('success') // Friend accepted sound
    }

    const handleReject = async (uid: string) => {
        await rejectFriendRequest(uid)
        play('click') // Reject click
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-pw-violet/20 z-40 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-900 z-50 shadow-2xl flex flex-col font-sans border-l border-none dark:border-slate-800"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-pw-border dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 relative overflow-hidden">
                            <div className="relative z-10 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-pw-surface dark:bg-slate-800 border border-pw-border dark:border-slate-700 flex items-center justify-center text-pw-indigo shadow-sm">
                                    <FaUserFriends className="text-xl" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-pw-violet dark:text-white">Social Hub</h2>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Connect & Compete</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-pw-surface dark:hover:bg-slate-800 rounded-full text-gray-400 hover:text-pw-indigo transition-colors relative z-10"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex px-4 pt-2 border-b border-pw-border dark:border-slate-800 bg-white dark:bg-slate-900">
                            <button
                                onClick={() => setActiveTab('friends')}
                                className={`flex-1 py-3 text-sm font-bold transition-colors relative ${activeTab === 'friends' ? 'text-pw-indigo' : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'}`}
                            >
                                Friends
                                <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'friends' ? 'bg-pw-indigo/10 text-pw-indigo' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}>{(friends || []).length}</span>
                                {activeTab === 'friends' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-pw-indigo rounded-t-full" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('requests')}
                                className={`flex-1 py-3 text-sm font-bold transition-colors relative ${activeTab === 'requests' ? 'text-pw-indigo' : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'}`}
                            >
                                Requests
                                {incomingRequests.length > 0 && (
                                    <span className="ml-1.5 bg-pw-red text-white px-2 py-0.5 rounded-full text-[10px] shadow-sm animate-pulse">{incomingRequests.length}</span>
                                )}
                                {activeTab === 'requests' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-pw-indigo rounded-t-full" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('add')}
                                className={`flex-1 py-3 text-sm font-bold transition-colors relative ${activeTab === 'add' ? 'text-pw-indigo' : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'}`}
                            >
                                <span className="flex items-center justify-center gap-1.5">
                                    <FaUserPlus className="text-xs" /> Add
                                </span>
                                {activeTab === 'add' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-pw-indigo rounded-t-full" />}
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 bg-pw-surface dark:bg-slate-950">
                            {activeTab === 'friends' && (
                                <div className="space-y-3">
                                    {friends.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                                            <div className="w-20 h-20 rounded-full bg-pw-surface dark:bg-slate-800 border-2 border-dashed border-pw-border dark:border-slate-700 flex items-center justify-center text-3xl text-gray-300 mb-4">
                                                <FaUserFriends />
                                            </div>
                                            <h3 className="text-pw-violet dark:text-white font-bold mb-1">No friends yet</h3>
                                            <p className="text-sm text-gray-500 mb-4">Invite classmates to start competing!</p>
                                            <button
                                                onClick={() => setActiveTab('add')}
                                                className="px-6 py-2 bg-pw-indigo text-white rounded-xl text-sm font-bold shadow-pw-md hover:bg-pw-violet transition-colors"
                                            >
                                                Add Friend
                                            </button>
                                        </div>
                                    ) : (
                                        friends.map((friend: Friend, idx: number) => (
                                            <motion.div
                                                key={friend.uid}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-pw-sm border border-pw-border dark:border-slate-800 flex items-center gap-3 hover:shadow-pw-md transition-shadow group"
                                            >
                                                <div className="relative">
                                                    <div className="w-12 h-12 rounded-xl p-[2px] bg-gradient-to-br from-pw-indigo to-pw-violet">
                                                        <div className="w-full h-full rounded-[10px] overflow-hidden bg-white">
                                                            <SafeAvatar
                                                                src={friend.photoURL}
                                                                alt={friend.displayName}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* User Badge (Top Left) */}
                                                    <UserBadge size="sm" className="-top-1 -left-1" userProfile={friend} showDefault={false} />

                                                    {/* Online Status Indicator */}
                                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center ${onlineUsers[friend.uid] === 'playing' ? 'bg-orange-500' :
                                                        onlineUsers[friend.uid] === 'in-lobby' ? 'bg-blue-500' :
                                                            onlineUsers[friend.uid] === 'online' ? 'bg-green-500' :
                                                                'bg-gray-400'
                                                        }`}>
                                                        {onlineUsers[friend.uid] && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                                                    </div>

                                                    {/* Manual badges removed - replaced by UserBadge */}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-pw-violet dark:text-white truncate">{friend.displayName}</h3>
                                                    <p className={`text-xs font-bold ${onlineUsers[friend.uid] === 'playing' ? 'text-orange-500' :
                                                        onlineUsers[friend.uid] === 'in-lobby' ? 'text-blue-500' :
                                                            onlineUsers[friend.uid] === 'online' ? 'text-green-600' :
                                                                'text-gray-400'
                                                        }`}>
                                                        {onlineUsers[friend.uid] === 'playing' ? 'Playing Quiz 🎮' :
                                                            onlineUsers[friend.uid] === 'in-lobby' ? 'In Lobby ⏳' :
                                                                onlineUsers[friend.uid] === 'online' ? 'Online' :
                                                                    'Offline'}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {onPlayWithFriend && (
                                                        <button
                                                            onClick={() => onPlayWithFriend(friend)}
                                                            className={`p-2 rounded-lg transition-all flex items-center justify-center ${onlineUsers[friend.uid] ? 'bg-pw-indigo text-white shadow-pw-sm hover:scale-105' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`}
                                                            title={onlineUsers[friend.uid] ? "Challenge Friend" : "Friend Offline"}
                                                        >
                                                            <FaGamepad />
                                                        </button>
                                                    )}
                                                    {onInvite && (
                                                        <InviteButton
                                                            friendUid={friend.uid}
                                                            onInvite={onInvite}
                                                            loading={externalInviteLoading}
                                                        />
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'requests' && (
                                <div className="space-y-6">
                                    {/* Incoming Requests */}
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Incoming ({incomingRequests.length})</h3>
                                        <div className="space-y-3">
                                            {incomingRequests.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-8 text-center opacity-60 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                                                    <FaEnvelope className="text-2xl text-gray-300 mb-2" />
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">No incoming requests</p>
                                                </div>
                                            ) : (
                                                incomingRequests.map((req, idx) => (
                                                    <motion.div
                                                        key={req.uid}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-pw-sm border border-pw-border dark:border-slate-800"
                                                    >
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="relative shrink-0 w-10 h-10">
                                                                <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 border border-pw-border">
                                                                    <SafeAvatar
                                                                        src={req.photoURL}
                                                                        alt={req.displayName}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                                <UserBadge size="sm" className="-top-1 -right-1" userProfile={req} showDefault={false} />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-pw-violet dark:text-white text-sm">{req.displayName}</h3>
                                                                <p className="text-[10px] text-pw-indigo font-medium">Wants to be your friend</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleAccept(req.uid)}
                                                                className="flex-1 bg-pw-indigo text-white py-2 rounded-xl text-xs font-bold shadow-pw-md hover:bg-pw-violet transition-all flex items-center justify-center gap-1.5 active:scale-95"
                                                            >
                                                                <FaCheck /> Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(req.uid)}
                                                                className="flex-1 bg-pw-surface text-gray-600 py-2 rounded-xl text-xs font-bold border border-pw-border hover:bg-white hover:text-pw-red transition-all flex items-center justify-center gap-1.5 active:scale-95"
                                                            >
                                                                <FaTimes /> Reject
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Outgoing Requests */}
                                    {requests.filter(r => r.direction === 'sent').length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Sent ({requests.filter(r => r.direction === 'sent').length})</h3>
                                            <div className="space-y-3">
                                                {requests.filter(r => r.direction === 'sent').map((req, idx) => (
                                                    <motion.div
                                                        key={req.uid}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-pw-border dark:border-slate-800 opacity-80 hover:opacity-100 transition-opacity"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 border border-pw-border">
                                                                    <SafeAvatar
                                                                        src={req.photoURL}
                                                                        alt={req.displayName}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-bold text-gray-700 dark:text-gray-300 text-xs">{req.displayName}</h3>
                                                                    <p className="text-[10px] text-gray-400 font-medium">Request pending...</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleReject(req.uid)} // Using reject to cancel sent request
                                                                className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                                title="Cancel Request"
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'add' && (
                                <div className="space-y-6">
                                    {/* Referral Section */}
                                    <div className="relative overflow-hidden bg-gradient-to-br from-pw-indigo to-pw-violet p-6 rounded-2xl shadow-pw-lg text-white">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10 pointer-events-none" />

                                        <div className="relative z-10">
                                            <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                                                <FaShareAlt className="text-pw-lavender" />
                                                Refer & Earn
                                            </h4>

                                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 mb-4">
                                                <p className="text-sm text-white/90 mb-2">🎁 Invite friends and earn XP!</p>
                                                <div className="flex justify-around text-center">
                                                    <div>
                                                        <p className="font-bold text-xl text-amber-300">50 XP</p>
                                                        <p className="text-[10px] text-gray-200">You</p>
                                                    </div>
                                                    <div className="w-px bg-white/20"></div>
                                                    <div>
                                                        <p className="font-bold text-xl text-green-300">Bonus</p>
                                                        <p className="text-[10px] text-gray-200">Friend</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <p className="text-xs text-pw-lavender mb-2 uppercase font-bold tracking-wider">Your Link</p>
                                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/10 flex items-center gap-2">
                                                    <input
                                                        readOnly
                                                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${user?.uid || ''}`}
                                                        className="flex-1 bg-transparent text-xs text-white px-2 outline-none truncate"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`${window.location.origin}?ref=${user?.uid || ''}`);
                                                            setSuccess('Link copied!');
                                                            play('click');
                                                            setTimeout(() => setSuccess(''), 2000);
                                                        }}
                                                        className="px-3 py-1.5 bg-white text-pw-indigo rounded-lg text-xs font-bold hover:bg-pw-lavender transition-colors"
                                                    >
                                                        Copy
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        const msg = `🎯 Padhaku par padho aur top karo! Mere saath join karo aur special bonus pao! 🎁\n\n${window.location.origin}?ref=${user?.uid || ''}`;
                                                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                                                    }}
                                                    className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                                >
                                                    WhatsApp
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const msg = `🎯 Padhaku par padho aur top karo! Mere saath join karo aur special bonus pao! 🎁\n\n${window.location.origin}?ref=${user?.uid || ''}`;
                                                        window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin + '?ref=' + (user?.uid || ''))}&text=${encodeURIComponent(msg)}`, '_blank');
                                                    }}
                                                    className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                                >
                                                    Telegram
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Local Students Section */}
                                    {userProfile?.pincode ? (
                                        <LocalStudentsSection
                                            currentUserId={user?.uid}
                                            userPincode={userProfile.pincode}
                                            existingFriendIds={friends.map(f => f.uid)}
                                            pendingRequestIds={requests.map(r => r.uid)}
                                            onRequestSent={(uid: string) => {
                                                // Optimistic update handled internally by section or context
                                            }}
                                            onSendRequest={async (uid: string, email: string) => {
                                                try {
                                                    await sendFriendRequest(email, uid);
                                                    setSuccess(`Request sent to ${email}!`);
                                                    setTimeout(() => setSuccess(''), 3000);
                                                } catch (e: any) {
                                                    setError(e.message);
                                                    setTimeout(() => setError(''), 3000);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-yellow-800 text-sm">
                                            <p className="font-bold mb-1">📍 Local Ranks Unavailable</p>
                                            <p>Please update your PIN Code in profile to see top students near you.</p>
                                        </div>
                                    )}


                                    <div className="bg-white p-5 rounded-2xl shadow-pw-sm border border-pw-border">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1.5 bg-pw-indigo/10 rounded-lg text-pw-indigo">
                                                <FaSearch />
                                            </div>
                                            <label className="text-sm font-bold text-pw-violet">Add by Email</label>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="email"
                                                placeholder="friend@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="flex-1 bg-pw-surface border border-pw-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pw-indigo/20 focus:border-pw-indigo outline-none transition-all placeholder-gray-400 text-pw-violet"
                                            />
                                            <button
                                                onClick={handleSendRequest}
                                                disabled={inviteLoading || !email}
                                                className="bg-pw-indigo text-white px-5 py-2 rounded-xl hover:bg-pw-violet disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-pw-md font-bold"
                                            >
                                                {inviteLoading ? (
                                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                                                ) : <FaUserPlus />}
                                            </button>
                                        </div>
                                        {error && <p className="text-pw-red text-xs mt-3 bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-1"><FaTimes className="shrink-0" /> {error}</p>}
                                        {success && <p className="text-green-600 text-xs mt-3 bg-green-50 p-2 rounded-lg border border-green-100 flex items-center gap-1"><FaCheck className="shrink-0" /> {success}</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
