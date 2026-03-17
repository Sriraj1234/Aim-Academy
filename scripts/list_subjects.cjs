const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        }),
    });
}

const db = admin.firestore();

async function listSubjects() {
    console.log("--- SUBJECT LIST ---");
    const streamDoc = db.doc('questions/BSEB/Class 10/general');
    const cols = await streamDoc.listCollections();
    console.log("Found " + cols.length + " collections under BSEB/Class 10/general:");
    for (const c of cols) {
        const snap = await c.get();
        console.log("  - " + c.id + " (" + snap.size + " questions)");
    }
    console.log("--- DONE ---");
}

listSubjects().catch(console.error);
