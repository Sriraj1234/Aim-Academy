'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/shared/Header';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { FaTrophy, FaMedal, FaMapMarkerAlt, FaGlobeAmericas, FaUserAstronaut } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardUser {
    uid: string;
    displayName: string;
    photoURL?: string;
    xp: number;
    city?: string;
    rank: number;
}

export default function LeaderboardPage() {
    const { user, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'global' | 'local'>('global');
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRank, setUserRank] = useState<number | null>(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            // Avoid double fetch if not needed immediately? 
            // Actually good to fetch on tab change to keep logic simple.
            setLoading(true);
            try {
                const usersRef = collection(db, 'users');
                let q;

                if (activeTab === 'local' && userProfile?.city) {
                    // Local Query
                    // Note: Requires Index (city ASC, gamification.xp DESC)
                    q = query(
                        usersRef,
                        where('city', '==', userProfile.city),
                        orderBy('gamification.xp', 'desc'),
                        limit(50)
                    );
                } else {
                    // Global Query
                    q = query(
                        usersRef,
                        orderBy('gamification.xp', 'desc'),
                        limit(50)
                    );
                }

                const snapshot = await getDocs(q);
                const data: LeaderboardUser[] = snapshot.docs.map((doc, index) => {
                    const d = doc.data();
                    return {
                        uid: doc.id,
                        displayName: d.displayName || 'Unknown Warrior',
                        photoURL: d.photoURL,
                        // Fallback to 0 if gamification undefined (legacy users)
                        xp: d.gamification?.xp || d.stats?.totalXP || 0,
                        city: d.city,
                        rank: index + 1
                    };
                });

                // Filter out those with 0 XP to keep list competitive? optional.
                // For now keep all.

                setLeaderboard(data);

                // Find user's rank in this list (if present)
                const myEntry = data.find(u => u.uid === user?.uid);
                setUserRank(myEntry ? myEntry.rank : null);

            } catch (err) {
                console.error("Leaderboard fetch failed", err);
                // Fallback to empty
                setLeaderboard([]);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchLeaderboard();
    }, [user, activeTab, userProfile?.city]);

    const getMedalColor = (rank: number) => {
        switch (rank) {
            case 1: return 'text-yellow-400 drop-shadow-md'; // Gold
            case 2: return 'text-gray-400 drop-shadow-md';   // Silver
            case 3: return 'text-orange-400 drop-shadow-md'; // Bronze
            default: return 'text-pw-indigo font-bold opacity-50';
        }
    };

    return (
        <div className="min-h-screen bg-pw-surface pb-20 font-sans">
            <Header />

            <main className="pt-24 px-4 max-w-4xl mx-auto space-y-6">

                {/* Header & Tabs */}
                <div className="bg-white rounded-[2rem] p-2 border border-pw-border shadow-pw-md flex p-1.5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-pw-indigo/5 to-pw-violet/5 pointer-events-none" />

                    {['global', 'local'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as 'global' | 'local')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all relative z-10 ${activeTab === tab
                                    ? 'bg-white text-pw-violet shadow-md ring-1 ring-black/5'
                                    : 'text-gray-500 hover:text-pw-indigo'
                                }`}
                        >
                            {tab === 'global' ? <FaGlobeAmericas /> : <FaMapMarkerAlt />}
                            <span className="capitalize">{tab} Ranking</span>
                        </button>
                    ))}
                </div>

                {/* Status Bar for Local Mode */}
                {activeTab === 'local' && (
                    <div className="text-center">
                        {userProfile?.city ? (
                            <p className="text-sm font-bold text-gray-500">
                                Competitors in <span className="text-pw-violet">{userProfile.city}</span>
                            </p>
                        ) : (
                            <div className="inline-block bg-yellow-50 text-yellow-700 px-4 py-2 rounded-xl text-xs font-bold border border-yellow-200">
                                ⚠️ Update your profile location to see local ranks
                            </div>
                        )}
                    </div>
                )}

                {/* List */}
                <div className="bg-white rounded-[2.5rem] border border-pw-border shadow-pw-lg overflow-hidden min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <div className="w-12 h-12 border-4 border-pw-indigo border-t-transparent rounded-full animate-spin" />
                            <p className="text-gray-400 font-bold animate-pulse">Scanning the multiverse...</p>
                        </div>
                    ) : leaderboard.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                            <div className="text-4xl mb-2">🔭</div>
                            <h3 className="text-lg font-bold text-gray-600">No competitors found</h3>
                            <p className="text-gray-400 text-sm">Be the first to score XP in this region!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {/* Top 3 Header (Optional - Could do a podium visual later) */}

                            {leaderboard.map((player) => {
                                const isMe = player.uid === user?.uid;
                                return (
                                    <motion.div
                                        key={player.uid}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${isMe ? 'bg-pw-indigo/5 hover:bg-pw-indigo/10' : ''}`}
                                    >
                                        <div className="w-8 flex justify-center font-black text-lg">
                                            {player.rank <= 3 ? (
                                                <FaMedal className={`text-xl ${getMedalColor(player.rank)}`} />
                                            ) : (
                                                <span className="text-gray-400 text-sm">#{player.rank}</span>
                                            )}
                                        </div>

                                        <div className="relative">
                                            <img
                                                src={player.photoURL || `https://ui-avatars.com/api/?name=${player.displayName}&background=random`}
                                                alt={player.displayName}
                                                className={`w-12 h-12 rounded-full object-cover border-2 ${isMe ? 'border-pw-indigo' : 'border-white'} shadow-sm bg-gray-200`}
                                            />
                                            {player.rank === 1 && (
                                                <div className="absolute -top-2 -right-1 text-lg text-yellow-400 drop-shadow-lg animate-bounce">👑</div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className={`font-bold truncate ${isMe ? 'text-pw-indigo' : 'text-gray-800'}`}>
                                                {player.displayName} {isMe && '(You)'}
                                            </h4>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                {player.city && (
                                                    <span className="flex items-center gap-0.5">
                                                        <FaMapMarkerAlt className="text-[10px]" /> {player.city}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className="block font-black text-pw-violet text-lg">
                                                {player.xp.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">XP Earned</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* My Sticky Rank (if scrolled away or far down) */}
                {!loading && userRank && userRank > 10 && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        className="fixed bottom-20 left-4 right-4 max-w-4xl mx-auto"
                    >
                        <div className="bg-pw-violet text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between border-2 border-pw-indigo">
                            <div className="flex items-center gap-4">
                                <span className="font-black text-xl w-8 text-center">#{userRank}</span>
                                <div className="flex flex-col">
                                    <span className="font-bold">Your Rank</span>
                                    <span className="text-xs text-indigo-200 opacity-80">Keep pushing!</span>
                                </div>
                            </div>
                            <div className="font-black text-xl">
                                {leaderboard.find(u => u.uid === user?.uid)?.xp.toLocaleString()} XP
                            </div>
                        </div>
                    </motion.div>
                )}

            </main>
        </div>
    );
}
