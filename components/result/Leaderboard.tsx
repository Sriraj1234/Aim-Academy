import { motion } from 'framer-motion';
import { FaCrown, FaMedal, FaUser, FaClock, FaBullseye, FaFire } from 'react-icons/fa';
import Image from 'next/image';

interface LeaderboardEntry {
    userId: string;
    userName: string;
    userPhoto?: string | null;
    score: number;
    accuracy: number;
    timeTaken: number;
    rank: number;
    isCurrentUser: boolean;
    badge?: 'pro' | 'streak' | null;
}

interface LeaderboardProps {
    entries: LeaderboardEntry[];
    currentUserEntry?: LeaderboardEntry;
}

const getRankIcon = (rank: number) => {
    switch (rank) {
        case 1: return <FaCrown className="text-yellow-400 text-xl" />;
        case 2: return <FaMedal className="text-gray-300 text-xl" />;
        case 3: return <FaMedal className="text-amber-600 text-xl" />;
        default: return <span className="font-bold text-gray-400 w-6 text-center">{rank}</span>;
    }
};

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
};

export const Leaderboard = ({ entries, currentUserEntry }: LeaderboardProps) => {
    return (
        <div className="w-full max-w-2xl mx-auto bg-white rounded-[2rem] shadow-pw-xl border border-pw-border overflow-hidden">
            {/* Header */}
            <div className="bg-pw-indigo/5 p-6 border-b border-pw-border flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-pw-violet">Global Leaderboard</h2>
                    <p className="text-sm text-gray-500 font-medium">Top performers this session</p>
                </div>
                <div className="bg-white p-2 rounded-xl shadow-sm border border-pw-border">
                    <FaCrown className="text-pw-indigo text-xl" />
                </div>
            </div>

            <div className="flex flex-col">
                {/* List Header */}
                <div className="grid grid-cols-12 gap-2 px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-pw-border/50 bg-gray-50/50">
                    <div className="col-span-2 text-center">Rank</div>
                    <div className="col-span-6">Student</div>
                    <div className="col-span-2 text-center">Score</div>
                    <div className="col-span-2 text-center">Acc.</div>
                </div>

                {/* Scrollable List */}
                <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
                    {entries.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            No results yet. Be the first!
                        </div>
                    ) : (
                        entries.map((entry, index) => (
                            <motion.div
                                key={`${entry.userId}-${index}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`grid grid-cols-12 gap-2 px-6 py-4 items-center border-b border-pw-border/50 transition-colors ${entry.isCurrentUser ? 'bg-pw-indigo/5' : 'hover:bg-gray-50'
                                    }`}
                            >
                                <div className="col-span-2 flex justify-center">
                                    {getRankIcon(entry.rank)}
                                </div>

                                <div className="col-span-6 flex items-center gap-3">
                                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-pw-border">
                                        {entry.userPhoto ? (
                                            <Image
                                                src={entry.userPhoto}
                                                alt={entry.userName}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <FaUser size={12} />
                                            </div>
                                        )}
                                        {/* Badge Overlay */}
                                        {entry.badge === 'pro' && (
                                            <div className="absolute bottom-0 right-0 bg-amber-500 text-white text-[6px] p-0.5 rounded-full border border-white" title="Pro Scholar">
                                                <FaCrown />
                                            </div>
                                        )}
                                        {entry.badge === 'streak' && (
                                            <div className="absolute bottom-0 right-0 bg-red-500 text-white text-[6px] p-0.5 rounded-full border border-white" title="Streak Master">
                                                <FaFire />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className={`text-sm font-bold truncate ${entry.isCurrentUser ? 'text-pw-indigo' : 'text-gray-700'}`}>
                                            {entry.userName} {entry.isCurrentUser && '(You)'}
                                        </span>
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                            <FaClock size={8} /> {formatTime(entry.timeTaken)}
                                        </span>
                                    </div>
                                </div>

                                <div className="col-span-2 text-center font-black text-pw-violet text-sm">
                                    {entry.score}
                                </div>

                                <div className="col-span-2 text-center flex items-center justify-center gap-1">
                                    <span className={`text-xs font-bold ${entry.accuracy >= 80 ? 'text-green-600' : 'text-gray-500'}`}>
                                        {Math.round(entry.accuracy)}%
                                    </span>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Current User Fixed Bottom (if not in top view or just for emphasis) */}
                {currentUserEntry && (
                    <div className="bg-white border-t border-pw-border p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Rank</span>
                        </div>
                        <div className="flex items-center justify-between bg-pw-surface border border-pw-border rounded-xl p-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 flex items-center justify-center font-black text-lg text-pw-indigo">
                                    #{currentUserEntry.rank}
                                </div>
                                <div className="h-8 w-px bg-pw-border" />
                                <div>
                                    <div className="text-sm font-bold text-pw-violet">Score: {currentUserEntry.score}</div>
                                    <div className="text-xs text-gray-500">Acc: {Math.round(currentUserEntry.accuracy)}%</div>
                                </div>
                            </div>
                            <div className="text-xs font-bold text-gray-400 flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-pw-border">
                                <FaClock /> {formatTime(currentUserEntry.timeTaken)}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
