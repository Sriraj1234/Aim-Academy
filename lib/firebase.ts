import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
}

import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'

// Initialize Firebase App
const isNewApp = getApps().length === 0;
const app = isNewApp ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth
// Note: We use getAuth() here and set persistence in AuthContext to avoid initialization errors
const auth = getAuth(app);

// Initialize App Check
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

let appCheck;
// Only initialize on the client side
if (typeof window !== 'undefined') {
    // Note: To use this in development, you can set self.FIREBASE_APPCHECK_DEBUG_TOKEN = true in your browser console
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        appCheck = initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
            // Automatically refresh app check tokens as needed.
            isTokenAutoRefreshEnabled: true
        });
    }
}

// Enable Offline Persistence with fallback for restricted environments
// (private browsing, some Android WebViews, or iOS Safari restrictions block IndexedDB)
const isIndexedDBAvailable = (): boolean => {
    try {
        return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined' && window.indexedDB !== null;
    } catch {
        return false;
    }
};

const db = initializeFirestore(app,
    isIndexedDBAvailable()
        ? { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }
        : { localCache: memoryLocalCache() }
);

const rtdb = getDatabase(app)
const storage = getStorage(app)

export { app, auth, db, rtdb, storage }
