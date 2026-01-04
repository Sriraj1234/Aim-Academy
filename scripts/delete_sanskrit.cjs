const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, deleteDoc, writeBatch } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteSanskrit() {
    try {
        console.log("Searching for Sanskrit questions to delete...");

        // Query for ALL sanskrit questions (case insensitive coverage if needed, but we saw 'sanskrit' in script)
        const q = query(collection(db, 'questions'), where('subject', '==', 'sanskrit'));
        const snapshot = await getDocs(q);

        console.log(`Found ${snapshot.size} questions.`);

        if (snapshot.empty) {
            console.log("Nothing to delete.");
            return;
        }

        const batchSize = 400;
        let batch = writeBatch(db);
        let count = 0;
        let totalDeleted = 0;

        for (const doc of snapshot.docs) {
            batch.delete(doc.ref);
            count++;
            totalDeleted++;

            if (count >= batchSize) {
                await batch.commit();
                console.log(`Deleted batch. Total so far: ${totalDeleted}`);
                batch = writeBatch(db);
                count = 0;
            }
        }

        if (count > 0) {
            await batch.commit();
            console.log(`Deleted final batch. Total: ${totalDeleted}`);
        }

        console.log("Cleanup Complete.");

    } catch (e) {
        console.error("Error deleting:", e);
    }
}

deleteSanskrit();
