const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

// --- Firebase Initialization ---
try {
    const envPathLocal = path.join(__dirname, '..', '.env.local');
    const envPath = path.join(__dirname, '..', '.env');

    dotenv.config({ path: envPath });
    dotenv.config({ path: envPathLocal, override: true });

    if (!admin.apps.length) {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (!privateKey) {
            console.error("FIREBASE_PRIVATE_KEY not found!");
            process.exit(1);
        }
        if (privateKey.includes('\\n')) {
            privateKey = privateKey.replace(/\\n/g, '\n');
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            })
        });
    }
} catch (e) {
    console.error("Error initializing Firebase:", e);
    process.exit(1);
}

const db = admin.firestore();

async function deleteQuestions() {
    const questionsRef = db.collection('questions');
    let deletedCount = 0;

    console.log("Fetching Class 12 Bihar Board Chemistry questions to delete...");

    // Fetch by subject only to avoid missing index errors
    const snapshot = await questionsRef.where('subject', '==', 'Chemistry').get();

    const batchSize = 100;
    let batch = db.batch();
    let count = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const bd = (data.board || '').toLowerCase();
        const cls = (data.class || '').toLowerCase();

        if ((bd === 'bihar board' || bd === 'bseb') && (cls === 'class 12' || cls === '12')) {
            batch.delete(doc.ref);
            count++;
            deletedCount++;

            if (count >= batchSize) {
                await batch.commit();
                console.log(`Deleted ${deletedCount} questions...`);
                batch = db.batch();
                count = 0;
            }
        }
    }
    if (count > 0) {
        await batch.commit();
        console.log(`Deleted ${deletedCount} questions...`);
    }

    console.log(`Successfully deleted ${deletedCount} questions.`);
}

deleteQuestions().catch(console.error);
