const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });

if (!admin.apps.length) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.slice(1, -1);
        }
        privateKey = privateKey.replace(/\\n/g, '\n');
    }
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        })
    });
}

const db = getFirestore();

async function checkCount() {
    const q = db.collection('questions')
        .where('board', '==', 'BSEB')
        .where('class', '==', '12')
        .where('subject', '==', 'hindi'); // Checking LOWERCASE count

    const snapshot = await q.count().get();
    console.log(`Current 'hindi' questions count: ${snapshot.data().count}`);
}

checkCount().then(() => process.exit(0));
