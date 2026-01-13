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

        // Variable to hold the cleanup function for the current connection/listeners
        // This ensures that if the connection resets or the component unmounts, we clean up properly.
        let cleanupInner = () => { };

        const unsub = onValue(connectedRef, (snapshot) => {
            // 1. Clean up previous connection/listener if it exists (e.g. erratic connection)
            cleanupInner();

            if (snapshot.val() === false) {
                return;
            };

            // 2. Create NEW connection
            const conRef = push(myConnectionsRef);

            // Helper to set status
            const setStatus = (status: string) => {
                set(conRef, {
                    state: status,
                    last_changed: serverTimestamp(),
                    path: pathname
                });
            };

            // 3. Initial Setup
            onDisconnect(conRef).remove();
            setStatus(currentStatus);
            onDisconnect(lastOnlineRef).set(isOfflineForDatabase);

            // 4. Handle Visibility (Background/Foreground)
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'hidden') {
                    setStatus('away');
                } else {
                    setStatus(currentStatus);
                }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);

            // 5. Define Cleanup for THIS connection instance
            cleanupInner = () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                // Important: Remove this connection node when we navigate away (effect re-runs) 
                // or if we disconnect, so we don't leave ghost connections.
                set(conRef, null).catch(err => console.warn("Cleanup error", err));
            };
        });

        return () => {
            cleanupInner(); // Clean up current listeners and DB node
            unsub();        // Stop listening to .info/connected
        };
    }, [user, pathname]); // Re-run when path changes to update status

    return null;
};
