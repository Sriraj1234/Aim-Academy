'use client';

import { useEffect, useState, useCallback } from 'react';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { app, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
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

            // Force unregister old workers to clear bad state
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                for (const reg of regs) {
                    // unregister if it's the old one or if we want to force refresh
                    // console.log('Found SW:', reg.scope);
                    // await reg.unregister(); 
                    // actually, let's not unregister potentially valid ones unless we are sure.
                    // But for debugging, maybe we should?
                    // Let's rely on update instead.
                }
            }

            if (!vapidKey) {
                console.error('VAPID key not configured');
                toast.error('System Error: VAPID key missing. Contact support.');
                return null;
            }

            // Get existing or register new service worker
            let registration = await navigator.serviceWorker.getRegistration();

            if (!registration) {
                console.log('[FCM] No existing SW found, registering new one...');
                try {
                    registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                } catch (swError: any) {
                    console.error('SW Registration failed:', swError);
                    toast.error(`Service Worker Error: ${swError?.message || 'Unknown'}`);
                    return null;
                }
            } else {
                console.log('[FCM] Using existing service worker:', registration.scope);
            }

            // Wait for service worker to be active
            if (registration.installing) {
                console.log('[FCM] Service worker installing...');
                await new Promise<void>((resolve) => {
                    registration.installing?.addEventListener('statechange', (e) => {
                        if ((e.target as ServiceWorker).state === 'activated') {
                            console.log('[FCM] Service worker activated');
                            resolve();
                        }
                    });
                });
            } else if (registration.waiting) {
                console.log('[FCM] Service worker waiting...');
                await new Promise<void>((resolve) => {
                    registration.waiting?.addEventListener('statechange', (e) => {
                        if ((e.target as ServiceWorker).state === 'activated') {
                            resolve();
                        }
                    });
                });
            } else if (registration.active) {
                console.log('[FCM] Service worker active');
            }

            // Small delay to ensure SW is fully ready
            await new Promise(resolve => setTimeout(resolve, 100));

            // Sanitize VAPID key (convert from Base64URL to Base64)
            // This prevents "Failed to execute 'atob' on 'Window'" error
            let validVapidKey = vapidKey;
            try {
                // Check if it needs conversion (contains - or _)
                if (validVapidKey.includes('-') || validVapidKey.includes('_')) {
                    validVapidKey = validVapidKey.replace(/-/g, '+').replace(/_/g, '/');
                    // Add padding if needed
                    const padding = '='.repeat((4 - validVapidKey.length % 4) % 4);
                    validVapidKey += padding;
                }
            } catch (e) { console.error('Error rewriting VAPID key', e); }

            const token = await getToken(messaging, {
                vapidKey: validVapidKey,
                serviceWorkerRegistration: registration
            });

            if (token) {
                console.log('FCM Token:', token);
                setFcmToken(token);

                if (user?.uid) {
                    await updateDoc(doc(db, 'users', user.uid), {
                        fcmToken: token,
                        notificationsEnabled: true,
                        lastTokenUpdate: new Date().toISOString()
                    });
                    console.log('FCM token saved to Firestore');
                }
                return token;
            } else {
                toast.error('Failed to generate FCM token. Check network.');
            }
        } catch (error: any) {
            console.error('Error getting/saving token:', error);
            const msg = error?.message || 'Unknown error';
            if (msg.includes('permission')) {
                toast.error('Notification permission denied by browser.');
            } else if (msg.includes('no active Service Worker')) {
                toast.error('System Error: Service Worker not active.');
            } else {
                toast.error(`Notification Error: ${msg}`);
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

