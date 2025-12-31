import { useLocalStudents } from '@/hooks/useLocalStudents';
import { FaUserPlus, FaCheck, FaTrophy } from 'react-icons/fa';
import { useState } from 'react';

interface LocalStudentsSectionProps {
    currentUserId?: string;
    userPincode: string;
    existingFriendIds: string[];
    onSendRequest: (uid: string, email: string) => Promise<void>;
    onRequestSent: (uid: string) => void;
}

export const LocalStudentsSection = ({
    currentUserId,
    userPincode,
    existingFriendIds,
    onSendRequest,
    onRequestSent
}: LocalStudentsSectionProps) => {
    const { localStudents, loading, error } = useLocalStudents(currentUserId, userPincode);
    const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
    const [sendingId, setSendingId] = useState<string | null>(null);

    const handleSend = async (uid: string, email: string) => {
        setSendingId(uid);
        try {
            await onSendRequest(uid, email);
            setSentRequests(prev => new Set(prev).add(uid));
            onRequestSent(uid);
        } catch (e) {
            console.error(e);
        } finally {
            setSendingId(null);
        }
    };

    if (loading) return <div className="p-4 text-center text-gray-400 text-sm">Finding students near your location...</div>;
    if (error) return <div className="p-4 text-center text-red-400 text-xs">Error: {error}</div>;

    // Filter out existing friends
    const displayStudents = localStudents.filter(s => !existingFriendIds.includes(s.uid));

    if (displayStudents.length === 0) return (
        <div className="bg-white p-5 rounded-2xl border border-pw-border text-center">
            <p className="text-pw-violet font-bold mb-1">No other students found nearby yet.</p>
            <p className="text-xs text-gray-500">Be the first to invite your friends!</p>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl border border-pw-border overflow-hidden">
            <div className="p-4 border-b border-pw-border bg-gray-50/50">
                <h3 className="font-bold text-pw-violet text-sm flex items-center gap-2">
                    <span className="text-amber-500"><FaTrophy /></span>
                    Top Students in {userPincode}
                </h3>
            </div>
            <div className="max-h-60 overflow-y-auto">
                {displayStudents.map((student, idx) => {
                    const isSent = sentRequests.has(student.uid);
                    return (
                        <div key={student.uid} className="flex items-center gap-3 p-3 border-b border-pw-border last:border-0 hover:bg-gray-50 transition-colors">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${student.rank <= 3 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                                {student.rank}
                            </div>
                            <img
                                src={student.photoURL || `https://ui-avatars.com/api/?name=${student.displayName}`}
                                alt={student.displayName}
                                className="w-8 h-8 rounded-full bg-gray-200 object-cover"
                                referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-800 truncate">{student.displayName}</p>
                                <p className="text-[10px] text-gray-500 font-medium flex items-center gap-2">
                                    <span className={student.stats?.avgScore === 100 ? 'text-green-600' : ''}>{student.stats?.avgScore ? `${student.stats.avgScore.toFixed(0)}% Acc` : 'New'}</span>
                                    {student.stats?.totalXP ? <span className="text-gray-300">•</span> : null}
                                    {student.stats?.totalXP ? <span>{student.stats.totalXP} XP</span> : null}
                                </p>
                            </div>
                            <button
                                onClick={() => handleSend(student.uid, student.email)}
                                disabled={isSent || sendingId === student.uid}
                                className={`p-2 rounded-lg text-xs transition-colors ${isSent
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-pw-surface text-pw-indigo hover:bg-pw-indigo hover:text-white'
                                    }`}
                            >
                                {isSent ? <FaCheck /> : (sendingId === student.uid ? <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" /> : <FaUserPlus />)}
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};
