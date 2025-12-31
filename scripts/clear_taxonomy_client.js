
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearTaxonomy() {
    console.log("Starting taxonomy cleanup (Client SDK)...");
    const taxonomyRef = doc(db, 'metadata', 'taxonomy');

    try {
        await setDoc(taxonomyRef, {
            subjects: {},
            chapters: {},
            lastUpdated: new Date()
        });

        console.log("Taxonomy metadata cleared successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error clearing taxonomy:", error);
        process.exit(1);
    }
}

clearTaxonomy();
