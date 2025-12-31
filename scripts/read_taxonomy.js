
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
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

async function readTaxonomy() {
    console.log("Reading taxonomy metadata...");
    const taxonomyRef = doc(db, 'metadata', 'taxonomy');

    try {
        const docSnap = await getDoc(taxonomyRef);
        if (docSnap.exists()) {
            console.log("Taxonomy Data:", JSON.stringify(docSnap.data(), null, 2));
        } else {
            console.log("No taxonomy document found!");
        }
        process.exit(0);
    } catch (error) {
        console.error("Error reading taxonomy:", error);
        process.exit(1);
    }
}

readTaxonomy();
