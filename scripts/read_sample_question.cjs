const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

try {
    const envPathLocal = path.join(__dirname, '..', '.env.local');
    const envPath = path.join(__dirname, '..', '.env');

    dotenv.config({ path: envPath });
    dotenv.config({ path: envPathLocal, override: true });

    if (!admin.apps.length) {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (privateKey && privateKey.includes('\\n')) {
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

async function readSample() {
    const questionsRef = db.collection('questions');
    // Try to find one of the newly uploaded questions
    const snapshot = await questionsRef
        .where('source', '==', 'excel_upload_jan_2026')
        .limit(1)
        .get();

    if (snapshot.empty) {
        console.log("No questions found with source 'excel_upload_jan_2026'.");
        return;
    }

    snapshot.forEach(doc => {
        console.log("Sample Document ID:", doc.id);
        console.log(JSON.stringify(doc.data(), null, 2));
    });
}

readSample();
