// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { FriendsProvider, useFriendsContext } from '@/context/FriendsContext' // Corrected hook name
import { useLanguage } from '@/context/LanguageContext'
import { HiArrowLeft, HiChevronRight } from 'react-icons/hi'
import { FaUserEdit, FaHistory, FaGlobe, FaQuestionCircle, FaSignOutAlt, FaCrown, FaStar, FaBolt, FaMapMarkerAlt, FaUserFriends, FaTrash, FaFire } from 'react-icons/fa'
import { Button } from '@/components/shared/Button'
import { BadgeSection } from '@/components/profile/BadgeSection'
import { Badge } from '@/data/types'

import { collection, query, where, getCountFromServer } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Note: Metadata export is not valid in client component like this in App Router usually, 
// but existing code had it. Changing title string as requested.
// Ideally this should be in a separate layout or page wrapper.
const metadata = {
    title: 'My Profile - Padhaku',
    description: 'Manage your profile'
}

function ProfileContent() {
    const { user, userProfile, logout, updateProfile } = useAuth()
    const { t, language, setLanguage } = useLanguage()
    const { friends, removeFriend } = useFriendsContext()
    const router = useRouter()

    const [isEditing, setIsEditing] = useState(false)
    const [localRank, setLocalRank] = useState<number | null>(null)
    const [formData, setFormData] = useState({
        displayName: '',
        board: '',
        class: '',
        stream: ''
    })
    const [loading, setLoading] = useState(false)

    // Fetch Local Rank
    useEffect(() => {
        const fetchLocalRank = async () => {
            console.log("Fetching Local Rank...", { pincode: userProfile?.pincode, avgScore: userProfile?.stats?.avgScore });

            if (!userProfile?.pincode) {
                setLocalRank(null);
                return;
            }
            if (userProfile?.stats?.avgScore === undefined || userProfile?.stats?.avgScore === null) {
                setLocalRank(null);
                return;
            }

            try {
                const q = query(
                    collection(db, 'users'),
                    where('pincode', '==', userProfile.pincode),
                    where('stats.avgScore', '>', userProfile.stats.avgScore)
                )
                const snapshot = await getCountFromServer(q);
                setLocalRank(snapshot.data().count + 1);
            } catch (err) {
                console.error("Error fetching local rank:", err);
            }
        }
        fetchLocalRank();
    }, [userProfile?.pincode, userProfile?.stats?.avgScore])

    useEffect(() => {
        if (userProfile) {
            setFormData({
                displayName: userProfile.displayName || user?.displayName || '',
                board: userProfile.board || '',
                class: userProfile.class || '',
                stream: userProfile.stream || ''
            })
        }
    }, [userProfile, user])

    const handleLogout = async () => {
        await logout()
        router.push('/login')
    }

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'hi' : 'en')
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            await updateProfile({
                displayName: formData.displayName,
                board: formData.board,
                class: formData.class,
                stream: formData.stream || null
            })
            setIsEditing(false)
        } catch (error) {
            console.error('Failed to update profile', error)
        } finally {
            setLoading(false)
        }
    }

    const menuItems = [
        { icon: <FaUserEdit />, label: t('profile.editProfile'), onClick: () => setIsEditing(true) },
        { icon: <FaHistory />, label: t('profile.activityHistory'), href: '#' },
        { icon: <FaGlobe />, label: t('profile.language'), value: language === 'en' ? 'English' : 'हिंदी', onClick: toggleLanguage },
        { icon: <FaQuestionCircle />, label: t('profile.helpSupport'), href: '#' },
    ]

    // Gamification Streak
    const streak = userProfile?.gamification?.currentStreak || 0;

    const stats = [
        { label: 'Streak', value: `${streak} 🔥`, icon: <FaFire />, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-100' },
        { label: 'Accuracy', value: `${userProfile?.stats?.avgScore ?? 0}%`, icon: <FaStar />, color: 'text-pw-indigo', bg: 'bg-indigo-50 border-indigo-100' },
        {
            label: 'Local Rank',
            value: localRank ? `#${localRank}` : (!userProfile?.pincode ? 'Set Loc' : '—'),
            icon: <FaMapMarkerAlt />,
            color: 'text-teal-600',
            bg: 'bg-teal-50 border-teal-100',
            action: !userProfile?.pincode ? () => setIsEditing(true) : undefined
        },
        { label: 'Global Rank', value: userProfile?.stats?.rank ? `#${userProfile.stats.rank}` : '-', icon: <FaCrown />, color: 'text-pw-red', bg: 'bg-red-50 border-red-100' },
    ]

    const formatLocation = () => {
        if (!userProfile?.locality && !userProfile?.city) return 'Location not set'
        const parts = [userProfile.locality, userProfile.city, userProfile.state].filter(Boolean)
        return parts.join(', ')
    }

    // Define Badges Logic
    const allBadges: Badge[] = [
        {
            id: 'pro_member',
            name: 'Pro Scholar',
            description: 'Active Pro Subscription',
            icon: 'FaCrown',
            color: 'text-amber-500',
            condition: 'pro',
            isUnlocked: userProfile?.subscription?.plan === 'pro' && userProfile?.subscription?.status === 'active'
        },
        {
            id: 'streak_7',
            name: 'Week Warrior',
            description: '7 Day Study Streak',
            icon: 'FaFire',
            color: 'text-orange-500',
            condition: 'streak_7',
            isUnlocked: (userProfile?.gamification?.currentStreak || 0) >= 7
        },
        {
            id: 'streak_30',
            name: 'Monthly Master',
            description: '30 Day Study Streak',
            icon: 'FaFire',
            color: 'text-red-500',
            condition: 'streak_30',
            isUnlocked: (userProfile?.gamification?.currentStreak || 0) >= 30
        },
        {
            id: 'accuracy_80',
            name: 'Sharp Shooter',
            description: 'Avg Score > 80%',
            icon: 'FaBullseye',
            color: 'text-pw-indigo',
            condition: 'accuracy_80',
            isUnlocked: (userProfile?.stats?.avgScore || 0) >= 80
        },
        {
            id: 'night_owl',
            name: 'Night Owl',
            description: 'Study hard at night',
            icon: 'FaMoon',
            color: 'text-blue-600',
            condition: 'quiz_master_50', // Reusing type for now, logically handled here
            isUnlocked: false // Placeholder for now, could check activity logs
        }
    ];

    return (
        <div className="min-h-screen bg-pw-surface text-gray-800 flex flex-col font-sans">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-[-10%] w-[30%] h-[30%] bg-pw-indigo/5 rounded-full blur-[80px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-pw-violet/5 rounded-full blur-[100px]" />
            </div>

            {/* Header */}
            <div className="px-4 py-4 flex items-center gap-4 sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-pw-border shadow-sm">
                <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-xl bg-pw-surface hover:bg-white border border-pw-border text-gray-600 transition-all shadow-sm">
                    <HiArrowLeft className="text-xl" />
                </Link>
                <h1 className="text-xl font-bold text-pw-violet">{t('profile.title')}</h1>
            </div>

            <div className="flex-1 px-4 pb-24 max-w-lg mx-auto w-full relative z-10 pt-6">

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2rem] p-6 shadow-pw-lg border border-pw-border mb-8 relative overflow-hidden"
                >
                    {/* Decorative Gradient Top */}
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-pw-indigo to-pw-violet opacity-10" />

                    <div className="flex flex-col items-center relative z-10 -mt-2">
                        <div className="w-28 h-28 rounded-full p-1 bg-white shadow-xl mb-4 relative">
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-pw-indigo to-pw-violet flex items-center justify-center text-4xl font-bold text-white shadow-inner overflow-hidden">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    (user?.email && user.email.length > 0) ? user.email[0].toUpperCase() : 'T'
                                )}
                            </div>

                            {/* Pro Badge Overlay */}
                            {userProfile?.subscription?.plan === 'pro' && userProfile?.subscription?.status === 'active' && (
                                <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-amber-500 rounded-full border-4 border-white flex items-center justify-center shadow-md z-20" title="Pro Scholar">
                                    <FaCrown className="text-white text-sm" />
                                </div>
                            )}

                            {/* Streak Badge Overlay (if not Pro, or secondary) */}
                            {/* Note: Showing only highest priority badge to avoid clutter */}
                            {userProfile?.subscription?.plan !== 'pro' && (userProfile?.gamification?.currentStreak || 0) >= 30 && (
                                <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-red-500 rounded-full border-4 border-white flex items-center justify-center shadow-md z-20" title="Monthly Master">
                                    <FaFire className="text-white text-sm" />
                                </div>
                            )}
                        </div>

                        {isEditing ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="w-full space-y-4"
                            >
                                <div>
                                    <label className="text-xs font-bold text-pw-indigo uppercase tracking-wider ml-1 mb-1 block">{t('profile.nameLabel')}</label>
                                    <input
                                        type="text"
                                        value={formData.displayName}
                                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                        className="w-full bg-pw-surface border border-pw-border rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pw-indigo/20 focus:border-pw-indigo transition-all font-medium"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-pw-indigo uppercase tracking-wider ml-1 mb-1 block">{t('profile.classLabel')}</label>
                                        <div className="relative">
                                            <select
                                                value={formData.class}
                                                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                                                className="w-full bg-pw-surface border border-pw-border rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pw-indigo/20 focus:border-pw-indigo appearance-none transition-all font-medium"
                                            >
                                                <option value="">Select</option>
                                                <option value="9">Class 9</option>
                                                <option value="10">Class 10</option>
                                                <option value="11">Class 11</option>
                                                <option value="12">Class 12</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                <HiChevronRight className="rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-pw-indigo uppercase tracking-wider ml-1 mb-1 block">{t('profile.boardLabel')}</label>
                                        <div className="relative">
                                            <select
                                                value={formData.board}
                                                onChange={(e) => setFormData({ ...formData, board: e.target.value })}
                                                className="w-full bg-pw-surface border border-pw-border rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pw-indigo/20 focus:border-pw-indigo appearance-none transition-all font-medium"
                                            >
                                                <option value="">Select</option>
                                                <option value="bseb">BSEB</option>
                                                <option value="cbse">CBSE</option>
                                                <option value="icse">ICSE</option>
                                                {/* Add other boards as needed */}
                                                <option value="other">Other</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                <HiChevronRight className="rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {['11', '12'].includes(formData.class) && (
                                    <div>
                                        <label className="text-xs font-bold text-pw-indigo uppercase tracking-wider ml-1 mb-1 block">{t('profile.streamLabel')}</label>
                                        <div className="relative">
                                            <select
                                                value={formData.stream}
                                                onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                                                className="w-full bg-pw-surface border border-pw-border rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pw-indigo/20 focus:border-pw-indigo appearance-none transition-all font-medium"
                                            >
                                                <option value="">Select Stream</option>
                                                <option value="science">Science</option>
                                                <option value="commerce">Commerce</option>
                                                <option value="arts">Arts</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                <HiChevronRight className="rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button fullWidth variant="ghost" onClick={() => setIsEditing(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-600">
                                        {t('profile.cancel')}
                                    </Button>
                                    <Button fullWidth onClick={handleSave} loading={loading} className="bg-pw-indigo hover:bg-pw-violet text-white shadow-pw-md">
                                        {t('profile.save')}
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center text-center w-full"
                            >
                                <h2 className="text-2xl font-display font-bold text-pw-violet mb-1">
                                    {userProfile?.displayName || user?.displayName || 'Topper Student'}
                                </h2>
                                <p className="text-gray-500 text-sm mb-3 font-medium">{user?.email}</p>

                                {/* Location Badge */}
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-pw-surface rounded-full border border-pw-border text-xs font-bold text-pw-indigo mb-6 shadow-sm">
                                    <FaMapMarkerAlt />
                                    <span>{formatLocation()}</span>
                                </div>

                                <div className="flex flex-wrap justify-center gap-2 w-full">
                                    {userProfile?.board && (
                                        <span className="px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-600 uppercase tracking-wide">
                                            {userProfile.board}
                                        </span>
                                    )}
                                    {userProfile?.class && (
                                        <span className="px-3 py-1 rounded-lg bg-pink-50 border border-pink-100 text-xs font-bold text-pink-600 uppercase tracking-wide">
                                            Class {userProfile.class}
                                        </span>
                                    )}
                                    {userProfile?.stream && ['11', '12'].includes(userProfile.class) && (
                                        <span className="px-3 py-1 rounded-lg bg-cyan-50 border border-cyan-100 text-xs font-bold text-cyan-600 uppercase tracking-wide">
                                            {userProfile.stream}
                                        </span>
                                    )}
                                    {!userProfile?.class && !userProfile?.stream && !userProfile?.board && (
                                        <span className="px-3 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs font-bold text-gray-500">
                                            {t('profile.guest')}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {!isEditing && (
                    <>
                        {/* Stats Grid */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                        >
                            {stats.map((stat, index) => (
                                <motion.div
                                    whileHover={{ y: -2 }}
                                    key={index}
                                    onClick={() => {
                                        // @ts-ignore
                                        if (stat.action) stat.action()
                                    }}
                                    className={`rounded-2xl p-4 flex flex-col items-center border ${stat.bg} shadow-sm ${// @ts-ignore
                                        stat.action ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                                >
                                    <div className={`text-xl mb-2 ${stat.color}`}>
                                        {stat.icon}
                                    </div>
                                    <span className="text-lg font-black text-gray-800">{stat.value}</span>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{stat.label}</span>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Badge Section */}
                        <BadgeSection badges={allBadges} />

                        {/* Menu Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-3xl overflow-hidden border border-pw-border shadow-pw-md mb-8"
                        >
                            {menuItems.map((item, index) => (
                                <div key={index}>
                                    <button
                                        onClick={item.onClick}
                                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-pw-surface transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-pw-surface flex items-center justify-center text-pw-indigo group-hover:bg-white group-hover:shadow-sm transition-all text-lg">
                                                {item.icon}
                                            </div>
                                            <span className="font-bold text-gray-700 group-hover:text-pw-violet transition-colors">{item.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-400">
                                            {item.value && <span className="text-sm font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-600">{item.value}</span>}
                                            <HiChevronRight className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </button>
                                    {index < menuItems.length - 1 && <div className="h-[1px] bg-gray-50 mx-6" />}
                                </div>
                            ))}
                        </motion.div>

                        {/* Friends Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="bg-white rounded-3xl overflow-hidden border border-pw-border shadow-pw-md p-6 mb-8"
                        >
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-pw-indigo">
                                    <FaUserFriends className="text-lg" />
                                </div>
                                <h3 className="font-bold text-lg text-pw-violet">My Squad ({(friends || []).length})</h3>
                            </div>

                            {(friends || []).length === 0 ? (
                                <div className="text-center py-6 bg-pw-surface rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-gray-500 font-medium text-sm">No friends added yet.</p>
                                    <Link href="/play/group" className="text-pw-indigo text-xs font-bold hover:underline mt-1 inline-block">
                                        Invite Friends to Play
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {friends.map((friend) => (
                                        <div key={friend.uid} className="flex items-center justify-between bg-pw-surface p-3 rounded-xl border border-pw-border hover:shadow-sm transition-shadow">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pw-indigo to-pw-violet p-[2px]">
                                                    <img
                                                        src={friend.photoURL || `https://ui-avatars.com/api/?name=${friend.displayName}`}
                                                        alt={friend.displayName}
                                                        className="w-full h-full rounded-[10px] object-cover bg-white"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-800">{friend.displayName}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Friend</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Are you sure you want to remove ${friend.displayName}?`)) {
                                                        removeFriend(friend.uid);
                                                    }
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove Friend"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        {/* Logout Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mt-4"
                        >
                            <button
                                onClick={handleLogout}
                                className="w-full bg-white border border-red-100 text-red-500 font-bold py-4 rounded-2xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                <FaSignOutAlt />
                                {t('profile.logout')}
                            </button>
                            <p className="text-center text-gray-400 text-xs mt-6 font-medium">
                                Padhaku v{t('profile.version')} • Physics Wallah Style
                            </p>
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    )
}

export default function ProfilePage() {
    return (
        <FriendsProvider>
            <ProfileContent />
        </FriendsProvider>
    )
}
