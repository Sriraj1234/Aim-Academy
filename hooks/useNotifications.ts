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

    // Request permission and get token
    const requestPermission = useCallback(async () => {
        if (!isSupported) {
            console.log('Notifications not supported');
            return null;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                // Get the FCM token
                const messaging = getMessaging(app);
                const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

                if (!vapidKey) {
                    console.error('VAPID key not configured');
                    return null;
                }

                // Register service worker first
                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                console.log('Service Worker registered:', registration);

                const token = await getToken(messaging, {
                    vapidKey,
                    serviceWorkerRegistration: registration
                });

                if (token) {
                    console.log('FCM Token:', token);
                    setFcmToken(token);

                    // Save token to Firestore if user is logged in
                    if (user?.uid) {
                        await updateDoc(doc(db, 'users', user.uid), {
                            fcmToken: token,
                            notificationsEnabled: true,
                            lastTokenUpdate: new Date().toISOString()
                        });
                        console.log('FCM token saved to Firestore');
                    }

                    return token;
                }
            } else {
                console.log('Notification permission denied');
                toast.error('Please enable notifications to stay updated!');
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }

        return null;
    }, [isSupported, user]);

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

            // Show toast notification for foreground messages
            const title = payload.notification?.title || 'Padhaku';
            const body = payload.notification?.body || '';
            toast.success(`${title}: ${body}`, { duration: 5000 });
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

