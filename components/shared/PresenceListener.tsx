'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { rtdb } from '@/lib/firebase';
import { ref, onValue, onDisconnect, set, serverTimestamp, push } from 'firebase/database';
import { usePathname } from 'next/navigation';

export const PresenceListener = () => {
    const { user } = useAuth();
    const pathname = usePathname();

    useEffect(() => {
        if (!user) return;

        // References
        const myConnectionsRef = ref(rtdb, `status/${user.uid}/connections`);
        const lastOnlineRef = ref(rtdb, `status/${user.uid}/lastOnline`);

        // Determine Status based on Path
        let currentStatus = 'online'; // Default (Home/Other)
        if (pathname?.includes('/play/group/lobby')) {
            currentStatus = 'in-lobby';
        } else if (pathname?.includes('/play/quiz') || pathname?.includes('/play/group/game')) {
            currentStatus = 'playing';
        }

        const isOfflineForDatabase = serverTimestamp();
        const isOnlineForDatabase = {
            state: currentStatus,
            last_changed: serverTimestamp(),
            path: pathname // Debugging help
        };

        const connectedRef = ref(rtdb, '.info/connected');

        const unsub = onValue(connectedRef, (snapshot) => {
            if (snapshot.val() === false) {
                return;
            };

            const conRef = push(myConnectionsRef);
            onDisconnect(conRef).remove();
            set(conRef, isOnlineForDatabase);
            onDisconnect(lastOnlineRef).set(isOfflineForDatabase);
        });

        return () => {
            unsub();
        };
    }, [user, pathname]); // Re-run when path changes to update status

    return null;
};
