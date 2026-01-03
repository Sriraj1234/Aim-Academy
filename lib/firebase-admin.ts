import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// This is used for server-side operations like sending push notifications

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // The private key needs to be properly formatted (replace \\n with actual newlines)
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        });
        console.log('Firebase Admin initialized');
    } catch (error) {
        console.error('Firebase Admin initialization error:', error);
    }
}

export const adminDb = admin.firestore();
export const adminMessaging = admin.messaging();
export default admin;
