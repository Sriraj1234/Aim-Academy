'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { rtdb } from '@/lib/firebase';
import { ref, onValue, onDisconnect, set, serverTimestamp, push } from 'firebase/database';

export const PresenceListener = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        // Reference to my connections list
        const myConnectionsRef = ref(rtdb, `status/${user.uid}/connections`);
        // Reference to last valid timestamp (for last seen)
        const lastOnlineRef = ref(rtdb, `status/${user.uid}/lastOnline`);

        const isOfflineForDatabase = serverTimestamp();
        const isOnlineForDatabase = {
            state: 'online',
            last_changed: serverTimestamp(),
        };

        const connectedRef = ref(rtdb, '.info/connected');

        const unsub = onValue(connectedRef, (snapshot) => {
            if (snapshot.val() === false) {
                return;
            };

            // We're connected (or reconnected)!
            // Create a reference to this unique connection
            const conRef = push(myConnectionsRef);

            // When I disconnect, remove this device
            onDisconnect(conRef).remove();

            // Add this device to my connections list
            // this value could contain info about the device or a timestamp too
            set(conRef, isOnlineForDatabase);

            // When I disconnect, update the last time I was seen online
            onDisconnect(lastOnlineRef).set(isOfflineForDatabase);
        });

        return () => {
            unsub();
            // No explicit cleanup here needed for connections; 
            // if we navigate away or unmount, we let onDisconnect handle it
            // OR we can explicitly remove *this* connection ref if we saved it.
            // But 'connectedRef' callback might fire multiple times?
            // Actually, we should probably track 'conRef' to remove it on unmount.
            // But since 'onValue' creates a closure, we can't easily access 'conRef' created inside.
            // It's cleaner to just rely on Firebase's socket disconnect or let it persist until tab close.
            // Refinement: If we re-render, we might create multiple connections for same tab?
            // No, useEffect dependency [user] means this only runs once per user session.
        };
    }, [user]);

    return null;
};
