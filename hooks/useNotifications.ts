'use client';

import { useEffect, useState, useCallback } from 'react';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { app, db } from '@/lib/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export const useNotifications = () => {
    const { user } = useAuth();
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(false);

    // Check if notifications are supported
    useEffect(() => {
        const checkSupport = async () => {
            if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
                setIsSupported(true);
                setPermission(Notification.permission);
            }
        };
        checkSupport();
    }, []);

    // Helper to get and save token
    const saveToken = useCallback(async () => {
        try {
            const messaging = getMessaging(app);
            // Using hardcoded key to prevent environment variable caching issues
            const vapidKey = 'BCph9csjTz0IwHdajt6xfzIYE_0feFWkqJsJNTEIJBXBEDPZMdi8lJneckXUn0RWgIXu5ywM3qoBb7XTFfb2Tic';
            console.log('Using VAPID Key:', vapidKey.substring(0, 10) + '...');

            if ('serviceWorker' in navigator) {
                // Check if SW is already registered
                let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');

                if (!registration) {
                    console.log('Registering new Service Worker...');
                    // Add timestamp to force update
                    registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js?t=' + Date.now());
                } else {
                    console.log('Updating existing Service Worker...');
                    await registration.update();
                }

                // Wait for it to be ready
                await navigator.serviceWorker.ready;

                // Explicitly pass VAPID key to getToken
                const token = await getToken(messaging, {
                    vapidKey,
                    serviceWorkerRegistration: registration
                });

                if (token) {
                    setFcmToken(token);
                    if (user?.uid) {
                        if (user?.uid) {
                            await setDoc(doc(db, 'users', user.uid), {
                                fcmToken: token,
                                notificationsEnabled: true,
                                lastTokenUpdate: new Date().toISOString()
                            }, { merge: true });
                        }
                    }
                    return token;
                }
            }
        } catch (error: any) {
            console.error('FCM Error Details:', error);
            // Specifically handling the "missing credentials" error which is often a VAPID mismatch
            if (error.code === 'messaging/token-subscribe-failed') {
                toast.error('Notification Error: VAPID Key Mismatch. Please clear site data and try again.');
            } else {
                toast.error(`Notification Error: ${error.message}`);
            }
        }
        return null;
    }, [user]);

    // Request permission and get token
    const requestPermission = useCallback(async () => {
        if (!isSupported) {
            console.log('Notifications not supported');
            toast.error('Notifications not supported on this device/browser.');
            return null;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                toast.loading('Enabling notifications...');
                const token = await saveToken();
                if (token) toast.success('Notifications enabled successfully!');
                return token;
            } else {
                console.log('Notification permission denied');
                toast.error('Permission denied. Please enable notifications in your browser settings.');
            }
        } catch (error: any) {
            console.error('Error requesting notification permission:', error);
            toast.error(`Permission Error: ${error?.message || 'Unknown'}`);
        }

        return null;
    }, [isSupported, saveToken]);

    // Auto-sync token if already granted
    useEffect(() => {
        if (isSupported && permission === 'granted' && user?.uid) {
            saveToken();
        }
    }, [isSupported, permission, user, saveToken]);

    // Listen for foreground messages
    useEffect(() => {
        if (!isSupported || permission !== 'granted') return;

        let messaging: Messaging;
        try {
            messaging = getMessaging(app);
        } catch (e) {
            console.log('Messaging not available');
            return;
        }

        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);

            const title = payload.notification?.title || 'Padhaku';
            const body = payload.notification?.body || '';
            const icon = '/padhaku-192.png';

            // 1. Show UI Toast
            toast.success(`${title}: ${body}`, { duration: 5000 });

            // 2. Play Notification Sound
            try {
                const audio = new Audio('/notification.mp3'); // We need to add this file or use external
                audio.play().catch(e => console.log('Audio play failed (interaction needed):', e));
            } catch (e) { }

            // 3. Trigger System Notification (for Sound/Vibration)
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(title, {
                        body: body,
                        icon: icon,
                        vibrate: [100, 50, 100],
                        data: payload.data,
                        actions: [{ action: 'open', title: 'Open' }]
                    } as any);
                });
            }
        });

        return () => {
            // Cleanup if needed
        };
    }, [isSupported, permission]);

    return {
        permission,
        fcmToken,
        isSupported,
        requestPermission
    };
};

