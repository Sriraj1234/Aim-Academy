// Firebase Cloud Messaging Service Worker
// This file MUST be in public/ and named exactly firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

// Firebase Configuration for aim-83922 project
// These values match .env.local
const firebaseConfig = {
    apiKey: "AIzaSyCPEYuY8TTYShOtfXYZcllBl_Vm6su",
    authDomain: "aim-83922.firebaseapp.com",
    projectId: "aim-83922",
    storageBucket: "aim-83922.firebasestorage.app",
    messagingSenderId: "134379665002",
    appId: "1:134379665002:web:34f8abf08f3c3655967c13"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages (when app is not in focus)
// Note: We rely on the FCM SDK and Browser to handle the default notification display.
// Implementing onBackgroundMessage with showNotification will cause DUPLICATE notifications.
// messaging.onBackgroundMessage((payload) => {
//     console.log('[FCM SW] Background message received:', payload);
// });

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[FCM SW] Notification clicked:', event.action);
    event.notification.close();

    if (event.action === 'dismiss') return;

    // Use click_action from data, or fcmOptions link, or default
    const urlToOpen = event.notification.data?.click_action || event.notification.data?.FCM_MSG?.notification?.click_action || '/home';

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

// Remove manual 'push' listener as it conflicts with Firebase SDK
// self.addEventListener('push', ...) -> REMOVED

console.log('[FCM SW] Service Worker loaded successfully');
