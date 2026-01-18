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

async function debugCount() {
    console.log("Starting count...");
    try {
        const snapshot = await db.collection('questions')
            .where('source', '==', 'excel_upload_jan_2026')
            .get();
        console.log(`Count: ${snapshot.size}`);
    } catch (e) {
        console.error("Error counting:", e);
    }
}

debugCount();
