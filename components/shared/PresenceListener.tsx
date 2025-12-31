'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { rtdb } from '@/lib/firebase';
import { ref, onValue, onDisconnect, set, serverTimestamp } from 'firebase/database';

export const PresenceListener = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const myStatusRef = ref(rtdb, `status/${user.uid}`);
        const isOfflineForDatabase = {
            state: 'offline',
            last_changed: serverTimestamp(),
        };
        const isOnlineForDatabase = {
            state: 'online',
            last_changed: serverTimestamp(),
        };

        const connectedRef = ref(rtdb, '.info/connected');
        let onlineTimer: NodeJS.Timeout;

        const unsub = onValue(connectedRef, (snapshot) => {
            if (snapshot.val() === false) {
                return;
            };

            // Setup disconnect handler first
            onDisconnect(myStatusRef).set(isOfflineForDatabase).then(() => {
                // Set Online immediately if connected.
                // Debounce wasn't the main issue, the main issue was likely the cleanup 'set(offline)' running on re-renders.
                // But we can keep a small delay just to be safe against rapid toggles, or just set it.
                // Google's example sets it immediately. Let's try immediate first to be responsive.
                set(myStatusRef, isOnlineForDatabase);
            });
        });

        return () => {
            unsub();
            // REMOVED: set(myStatusRef, isOfflineForDatabase);
            // We rely on onDisconnect() to handle tab closes/refresh.
            // Generous logic: It's better to show a user as "Online" for a timeout than "Offline" when they are actually there.
        };
    }, [user]);

    return null;
};
