import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { UserProfile } from '@/data/types';

export const useLocalStudents = (currentUserId?: string, userPincode?: string) => {
    const [localStudents, setLocalStudents] = useState<UserProfile[]>([]);
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

                // Note: Compound queries with orderBy usually require an index in Firestore.
                // To avoid requiring a custom index for every deployment immediately,
                // we will fetch by pincode and sort client-side for now, 
                // or just try to order if the index exists.
                // Given the requirement to show "rank wise", sorting is essential.

                // Strategy: Fetch users in this pincode. Limit 50.
                const q = query(
                    usersRef,
                    where("pincode", "==", userPincode),
                    limit(50)
                );

                const snapshot = await getDocs(q);

                const students: UserProfile[] = [];
                snapshot.forEach(doc => {
                    const data = doc.data() as UserProfile;
                    // Filter out self
                    if (data.uid !== currentUserId) {
                        students.push(data);
                    }
                });

                // Sort client-side by avgScore descending
                students.sort((a, b) => {
                    const scoreA = a.stats?.avgScore || 0;
                    const scoreB = b.stats?.avgScore || 0;
                    return scoreB - scoreA;
                });

                setLocalStudents(students);
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
