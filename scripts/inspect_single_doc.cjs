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

const fs = require('fs');
async function inspectDoc() {
    const docId = 'c7bac21e40e2609d021ec957ea87f6ad';
    console.log(`Inspecting ${docId}...`);
    const doc = await db.collection('questions').doc(docId).get();
    if (doc.exists) {
        fs.writeFileSync('single_doc.json', JSON.stringify(doc.data(), null, 2));
        console.log("Saved to single_doc.json");
    } else {
        console.log("Doc not found.");
    }
}

inspectDoc();
