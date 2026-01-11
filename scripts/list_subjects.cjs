const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const rawKey = process.env.FIREBASE_PRIVATE_KEY;
if (!rawKey) process.exit(1);

const processedKey = rawKey.replace(/\\n/g, '\n');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: processedKey,
        })
    });
}

const db = admin.firestore();

async function listSubjects() {
    const docRef = db.collection('metadata').doc('taxonomy');
    const docSnap = await docRef.get();

    if (docSnap.exists) {
        const data = docSnap.data();
        if (data['bseb_10']) {
            console.log("Subjects:", data['bseb_10'].subjects);
        }
    }
}

listSubjects().catch(console.error);
