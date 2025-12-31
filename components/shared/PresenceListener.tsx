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

        const unsub = onValue(connectedRef, (snapshot) => {
            // If we are not connected, we don't have to do anything.
            if (snapshot.val() === false) {
                return;
            };

            // If we are currently connected, we add this device to my connections list.
            // When I disconnect, remove this device
            onDisconnect(myStatusRef).set(isOfflineForDatabase).then(() => {
                // And set it to online
                set(myStatusRef, isOnlineForDatabase);
            });
        });

        return () => {
            unsub();
            // We purposely do NOT set offline here on simple component unmount 
            // because strict mode or navigations might trigger it.
            // onDisconnect handles the actual connection loss (tab close, network fail).
            // However, if the user LOGS OUT, we might want to set offline.
            // But since this component is tied to 'user', if user becomes null, this effect cleans up.
            // Let's set offline on cleanup IF user is still 'connected' technically, but practically onDisconnect is safer.
            // For now, let's rely on onDisconnect for 'closing' and let the explicit 'offline' set happen if meaningful.
            // Actually, for instant feedback, setting offline on unmount IS good if we are sure we are leaving.
            // But nextjs navigations unmount/mount layouts? No, layout persists.
            // So this is safe in Layout.
            set(myStatusRef, isOfflineForDatabase);
        };
    }, [user]);

    return null;
};
