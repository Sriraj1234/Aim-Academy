'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaUserFriends, FaUserPlus, FaTimes, FaCheck, FaSearch, FaGamepad, FaEnvelope, FaShareAlt } from 'react-icons/fa'
import { useFriends } from '@/hooks/useFriends'
import { useAuth } from '@/context/AuthContext'
import { LocalStudentsSection } from '@/components/home/LocalStudentsSection'

interface FriendsDrawerProps {
    isOpen: boolean
    onClose: () => void
    onInvite?: (friendUid: string) => void
    inviteLoading?: boolean
    onPlayWithFriend?: (friend: any) => void
}

export const FriendsDrawer = ({ isOpen, onClose, onInvite, inviteLoading: externalInviteLoading, onPlayWithFriend }: FriendsDrawerProps) => {
    const { user, userProfile } = useAuth();
    const { friends, requests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, loading, onlineUsers } = useFriends()
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
        } catch (err: any) {
            setError(err.message || 'Failed to send request')
        } finally {
            setInviteLoading(false)
        }
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
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col font-sans"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-pw-border flex items-center justify-between bg-white relative overflow-hidden">
                            <div className="relative z-10 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-pw-surface border border-pw-border flex items-center justify-center text-pw-indigo shadow-sm">
                                    <FaUserFriends className="text-xl" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-pw-violet">Social Hub</h2>
                                    <p className="text-xs text-gray-500 font-medium">Connect & Compete</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-pw-surface rounded-full text-gray-400 hover:text-pw-indigo transition-colors relative z-10"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex px-4 pt-2 border-b border-pw-border bg-white">
                            <button
                                onClick={() => setActiveTab('friends')}
                                className={`flex-1 py-3 text-sm font-bold transition-colors relative ${activeTab === 'friends' ? 'text-pw-indigo' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Friends
                                <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'friends' ? 'bg-pw-indigo/10 text-pw-indigo' : 'bg-gray-100 text-gray-500'}`}>{friends.length}</span>
                                {activeTab === 'friends' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-pw-indigo rounded-t-full" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('requests')}
                                className={`flex-1 py-3 text-sm font-bold transition-colors relative ${activeTab === 'requests' ? 'text-pw-indigo' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Requests
                                {incomingRequests.length > 0 && (
                                    <span className="ml-1.5 bg-pw-red text-white px-2 py-0.5 rounded-full text-[10px] shadow-sm animate-pulse">{incomingRequests.length}</span>
                                )}
                                {activeTab === 'requests' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-pw-indigo rounded-t-full" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('add')}
                                className={`flex-1 py-3 text-sm font-bold transition-colors relative ${activeTab === 'add' ? 'text-pw-indigo' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <span className="flex items-center justify-center gap-1.5">
                                    <FaUserPlus className="text-xs" /> Add
                                </span>
                                {activeTab === 'add' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-pw-indigo rounded-t-full" />}
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 bg-pw-surface">
                            {activeTab === 'friends' && (
                                <div className="space-y-3">
                                    {friends.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                                            <div className="w-20 h-20 rounded-full bg-pw-surface border-2 border-dashed border-pw-border flex items-center justify-center text-3xl text-gray-300 mb-4">
                                                <FaUserFriends />
                                            </div>
                                            <h3 className="text-pw-violet font-bold mb-1">No friends yet</h3>
                                            <p className="text-sm text-gray-500 mb-4">Invite classmates to start competing!</p>
                                            <button
                                                onClick={() => setActiveTab('add')}
                                                className="px-6 py-2 bg-pw-indigo text-white rounded-xl text-sm font-bold shadow-pw-md hover:bg-pw-violet transition-colors"
                                            >
                                                Add Friend
                                            </button>
                                        </div>
                                    ) : (
                                        friends.map((friend, idx) => (
                                            <motion.div
                                                key={friend.uid}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="bg-white p-3 rounded-2xl shadow-pw-sm border border-pw-border flex items-center gap-3 hover:shadow-pw-md transition-shadow group"
                                            >
                                                <div className="relative">
                                                    <div className="w-12 h-12 rounded-xl p-[2px] bg-gradient-to-br from-pw-indigo to-pw-violet">
                                                        <img
                                                            src={friend.photoURL || `https://ui-avatars.com/api/?name=${friend.displayName}`}
                                                            className="w-full h-full rounded-[10px] object-cover bg-white"
                                                            alt="avatar"
                                                            referrerPolicy="no-referrer"
                                                        />
                                                    </div>
                                                    {/* Online Status Indicator */}
                                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full flex items-center justify-center ${onlineUsers[friend.uid] === 'playing' ? 'bg-orange-500' :
                                                        onlineUsers[friend.uid] === 'in-lobby' ? 'bg-blue-500' :
                                                            onlineUsers[friend.uid] === 'online' ? 'bg-green-500' :
                                                                'bg-gray-400'
                                                        }`}>
                                                        {onlineUsers[friend.uid] && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-pw-violet truncate">{friend.displayName}</h3>
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
                                                            className={`p-2 rounded-lg transition-all flex items-center justify-center ${onlineUsers[friend.uid] ? 'bg-pw-indigo text-white shadow-pw-sm hover:scale-105' : 'bg-gray-100 text-gray-400'}`}
                                                            title={onlineUsers[friend.uid] ? "Challenge Friend" : "Friend Offline"}
                                                        >
                                                            <FaGamepad />
                                                        </button>
                                                    )}
                                                    {onInvite && (
                                                        <button
                                                            onClick={() => onInvite(friend.uid)}
                                                            className="p-2 rounded-lg bg-pw-surface text-pw-indigo border border-pw-border hover:bg-white hover:border-pw-indigo hover:shadow-sm transition-all"
                                                            title="Send Invite"
                                                        >
                                                            {externalInviteLoading ? <span className="animate-spin">C</span> : <FaShareAlt />}
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'requests' && (
                                <div className="space-y-3">
                                    {incomingRequests.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-64 text-center p-6 opacity-60">
                                            <FaEnvelope className="text-4xl text-gray-300 mb-3" />
                                            <p className="text-gray-500 font-medium">No pending requests</p>
                                        </div>
                                    ) : (
                                        incomingRequests.map((req, idx) => (
                                            <motion.div
                                                key={req.uid}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="bg-white p-4 rounded-2xl shadow-pw-sm border border-pw-border"
                                            >
                                                <div className="flex items-center gap-3 mb-4">
                                                    <img
                                                        src={req.photoURL || `https://ui-avatars.com/api/?name=${req.displayName}`}
                                                        className="w-10 h-10 rounded-full object-cover bg-gray-100 border border-pw-border"
                                                        alt="avatar"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                    <div>
                                                        <h3 className="font-bold text-pw-violet">{req.displayName}</h3>
                                                        <p className="text-xs text-pw-indigo font-medium">Wants to be your friend</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => acceptFriendRequest(req.uid)}
                                                        className="flex-1 bg-pw-indigo text-white py-2.5 rounded-xl text-sm font-bold shadow-pw-md hover:bg-pw-violet transition-all flex items-center justify-center gap-2 active:scale-95"
                                                    >
                                                        <FaCheck /> Accept
                                                    </button>
                                                    <button
                                                        onClick={() => rejectFriendRequest(req.uid)}
                                                        className="flex-1 bg-pw-surface text-gray-600 py-2.5 rounded-xl text-sm font-bold border border-pw-border hover:bg-white hover:text-pw-red transition-all flex items-center justify-center gap-2 active:scale-95"
                                                    >
                                                        <FaTimes /> Reject
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'add' && (
                                <div className="space-y-6">
                                    {/* Local Students Section */}
                                    {userProfile?.pincode ? (
                                        <LocalStudentsSection
                                            currentUserId={user?.uid}
                                            userPincode={userProfile.pincode}
                                            existingFriendIds={friends.map(f => f.uid)}
                                            onRequestSent={(uid: string) => {
                                                // Optimistic update or just let the user know
                                                // Ideally we'd add this ID to a 'success' set
                                            }}
                                            onSendRequest={async (uid: string, email: string) => {
                                                try {
                                                    await sendFriendRequest(email);
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

                                    <div className="relative overflow-hidden bg-gradient-to-br from-pw-indigo to-pw-violet p-6 rounded-2xl shadow-pw-lg text-white">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10 pointer-events-none" />

                                        <div className="relative z-10">
                                            <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                                                <FaShareAlt className="text-pw-lavender" />
                                                Invite Friends
                                            </h4>
                                            <p className="text-sm text-white/80 mb-4 leading-relaxed">
                                                Share your email with friends so they can add you directly.
                                            </p>

                                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-[10px] text-pw-lavender uppercase font-bold tracking-wider mb-0.5">Your Email</p>
                                                    <p className="text-sm font-bold truncate pr-2">{user?.email}</p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(user?.email || '')
                                                        setSuccess('Email copied to clipboard!')
                                                        setTimeout(() => setSuccess(''), 2000)
                                                    }}
                                                    className="px-3 py-1.5 bg-white text-pw-indigo rounded-lg text-xs font-bold hover:bg-pw-lavender transition-colors"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                        </div>
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
