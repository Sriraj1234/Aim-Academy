import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { UserProfile } from '@/data/types';

export interface RankedStudent extends UserProfile {
    rank: number;
}

export const useLocalStudents = (currentUserId?: string, userPincode?: string) => {
    const [localStudents, setLocalStudents] = useState<RankedStudent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUserId || !userPincode) {
            setLocalStudents([]);
            return;
        }

        const fetchLocalStudents = async () => {
            setLoading(true);
            setError(null);
            try {
                const usersRef = collection(db, 'users');

                // Fetch users in pincode (limit 50)
                const q = query(
                    usersRef,
                    where("pincode", "==", userPincode),
                    limit(50)
                );

                const snapshot = await getDocs(q);

                const students: UserProfile[] = [];
                snapshot.forEach(doc => {
                    const data = doc.data() as UserProfile;
                    // Filter out self if desired, OR keep self to show "You" in ranking
                    // The user usually wants to see where *they* stand, so let's keep self if consistent with UI
                    // Previous code filtered out self: "if (data.uid !== currentUserId)". 
                    // Let's stick to filtering out self for the "Friends/Local" list as requested, 
                    // or maybe the user wants to see themselves?
                    // The prompt implies "friends invite", but for leaderboard "rank", you usually want to see yourself.
                    // However, standard specific request was "local rank v true show nahi ho raha".
                    // I will keep the filter consistent with previous behavior (filtering self) for now to avoid duplicate "Me" cards if handled elsewhere.
                    if (data.uid !== currentUserId) {
                        students.push(data);
                    }
                });

                // Multi-level Sort: Accuracy -> XP -> Questions -> Name
                students.sort((a, b) => {
                    // 1. Accuracy (Desc)
                    const scoreA = a.stats?.avgScore || 0;
                    const scoreB = b.stats?.avgScore || 0;
                    if (scoreA !== scoreB) return scoreB - scoreA;

                    // 2. XP (Desc) - Tie Breaker 1
                    const xpA = a.stats?.totalXP || 0;
                    const xpB = b.stats?.totalXP || 0;
                    if (xpA !== xpB) return xpB - xpA;

                    // 3. Questions Solved (Desc) - Tie Breaker 2
                    const qA = a.stats?.questionsSolved || 0;
                    const qB = b.stats?.questionsSolved || 0;
                    if (qA !== qB) return qB - qA;

                    // 4. Name (Asc) - Deterministic
                    return (a.displayName || '').localeCompare(b.displayName || '');
                });

                // Assign Ranks with Tie Handling (1, 2, 2, 4 strategy)
                let currentRank = 1;
                const rankedStudents: RankedStudent[] = students.map((student, index, array) => {
                    // If not first item, check if ties with previous
                    if (index > 0) {
                        const prev = array[index - 1];
                        const prevScore = prev.stats?.avgScore || 0;
                        const prevXP = prev.stats?.totalXP || 0;
                        const prevQ = prev.stats?.questionsSolved || 0;

                        const currScore = student.stats?.avgScore || 0;
                        const currXP = student.stats?.totalXP || 0;
                        const currQ = student.stats?.questionsSolved || 0;

                        // If all metrics match, same rank. Else, rank = index + 1
                        if (prevScore === currScore && prevXP === currXP && prevQ === currQ) {
                            // Same rank as previous
                        } else {
                            currentRank = index + 1;
                        }
                    }

                    return { ...student, rank: currentRank };
                });

                setLocalStudents(rankedStudents);
            } catch (err: any) {
                console.error("Error fetching local students:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLocalStudents();
    }, [currentUserId, userPincode]);

    return { localStudents, loading, error };
};
