import admin from 'firebase-admin';

// Lazy initialization to prevent build-time errors
let initialized = false;

function initializeFirebaseAdmin() {
    if (initialized || admin.apps.length > 0) {
        return;
    }

    try {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;

        // If any required credential is missing, skip initialization
        if (!projectId || !clientEmail || !privateKey) {
            console.warn('Firebase Admin credentials not configured');
            return;
        }

        // Handle different formats of private key
        // Vercel may double-escape the newlines
        if (privateKey) {
            // Remove surrounding quotes if present
            if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
                privateKey = privateKey.slice(1, -1);
            }

            // Replace literal \n with actual newlines
            privateKey = privateKey.replace(/\\n/g, '\n');
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        });

        initialized = true;
        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Firebase Admin initialization error:', error);
    }
}

// Lazy getters for services
export function getAdminDb() {
    initializeFirebaseAdmin();
    return admin.firestore();
}

export function getAdminMessaging() {
    initializeFirebaseAdmin();
    return admin.messaging();
}

// For backwards compatibility - return actual Firestore reference
export const adminDb = {
    collection: (name: string) => {
        initializeFirebaseAdmin();
        if (!initialized && admin.apps.length === 0) {
            console.warn('Firebase Admin not initialized, returning mock');
            // Return a mock that won't crash
            return {
                doc: () => ({
                    get: async () => ({ exists: false, data: () => null }),
                    set: async () => { },
                    update: async () => { }
                }),
                add: async () => ({ id: 'mock' }),
                where: () => ({
                    get: async () => ({
                        docs: [],
                        forEach: (callback: (doc: any) => void) => { }
                    })
                })
            };
        }
        return admin.firestore().collection(name);
    }
};

export const adminMessaging = {
    send: (message: any) => {
        initializeFirebaseAdmin();
        return admin.messaging().send(message);
    },
    sendEachForMulticast: (message: any) => {
        initializeFirebaseAdmin();
        return admin.messaging().sendEachForMulticast(message);
    }
};

export default admin;

