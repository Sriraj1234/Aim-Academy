import admin from 'firebase-admin';

// Lazy initialization to prevent build-time errors
let initialized = false;
let initError: string | null = null;

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
            try {
                // First try to process as a JSON string if it's quoted
                // This handles complex escaping better than regex
                const cleanKey = privateKey.trim();
                if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
                    // User might have pasted the raw JSON string value including quotes
                    if (!cleanKey.includes('\\n') && cleanKey.includes('\n')) {
                        // Already has newlines, just strip quotes
                        privateKey = cleanKey.slice(1, -1);
                    } else {
                        // Has escaped newlines, standard JSON parse should fix it
                        // Wrapping in {} to parse valid JSON if it's just a string
                        const parsed = JSON.parse(`{"key": ${cleanKey}}`);
                        privateKey = parsed.key;
                    }
                } else {
                    // Standard unquoted copy-paste (newlines usually lost or escaped)
                    privateKey = cleanKey.replace(/\\n/g, '\n');
                }
            } catch (e) {
                // Fallback to manual cleaning
                console.warn('Failed to auto-parse private key, falling back to regex');
                privateKey = privateKey!.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
            }
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: privateKey!,
            }),
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        });

        initialized = true;
        console.log('Firebase Admin initialized successfully');
    } catch (error: any) {
        console.error('Firebase Admin initialization error:', error);
        initError = error.message || String(error);
    }
}

export function getInitError() {
    return initError;
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
                id: 'mock',
                doc: () => ({
                    get: async () => ({ exists: false, data: () => null }),
                    set: async () => { },
                    update: async () => { }
                }),
                add: async () => ({ id: 'mock' }),
                where: () => ({
                    get: async () => ({
                        docs: [],
                        size: 0,
                        forEach: (callback: (doc: any) => void) => { }
                    })
                }),
                get: async () => ({
                    docs: [],
                    size: 0,
                    forEach: (callback: (doc: any) => void) => { }
                })
            } as any;
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

