
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
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

async function countBySubject() {
    console.log("Counting questions by subject...");
    try {
        const snapshot = await getDocs(collection(db, 'questions'));
        const counts = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const subject = (data.subject || 'Unknown').toLowerCase();
            counts[subject] = (counts[subject] || 0) + 1;
        });

        console.log("Question Counts by Subject:");
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        sorted.forEach(([sub, count]) => {
            console.log(`${sub}: ${count}`);
        });

        process.exit(0);
    } catch (error) {
        console.error("Error counting:", error);
        process.exit(1);
    }
}

countBySubject();
