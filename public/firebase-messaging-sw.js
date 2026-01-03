// Firebase Cloud Messaging Service Worker
// This file MUST be in public/ and named exactly firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase Configuration for aim-83922 project
// IMPORTANT: Update these values to match your .env.local
const firebaseConfig = {
    apiKey: "AIzaSyBJbsR_XlzPzHNDdSGqdqZJQRww4VQZhVc",
    authDomain: "aim-83922.firebaseapp.com",
    projectId: "aim-83922",
    storageBucket: "aim-83922.firebasestorage.app",
    messagingSenderId: "117020260903544594123",
    appId: "1:117020260903544594123:web:f9e8d7c6b5a43210" // Update this from .env.local
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages (when app is not in focus)
messaging.onBackgroundMessage((payload) => {
    console.log('[FCM SW] Background message received:', payload);

    const notificationTitle = payload.notification?.title || 'Padhaku';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification!',
        icon: '/padhaku-192.png',
        badge: '/padhaku-192.png',
        vibrate: [100, 50, 100],
        tag: payload.data?.tag || 'default',
        data: {
            click_action: payload.data?.click_action || '/home',
            ...payload.data
        },
        actions: [
            { action: 'open', title: 'Open' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[FCM SW] Notification clicked:', event.action);
    event.notification.close();

    if (event.action === 'dismiss') return;

    const urlToOpen = event.notification.data?.click_action || '/home';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Focus existing window if open
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(urlToOpen);
                    return client.focus();
                }
            }
            // Otherwise open new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Handle push event (fallback)
self.addEventListener('push', (event) => {
    console.log('[FCM SW] Push event received');

    if (event.data) {
        const payload = event.data.json();
        const title = payload.notification?.title || 'Padhaku';
        const options = {
            body: payload.notification?.body || 'New notification',
            icon: '/padhaku-192.png',
            badge: '/padhaku-192.png',
        };

        event.waitUntil(self.registration.showNotification(title, options));
    }
});

console.log('[FCM SW] Service Worker loaded successfully');
