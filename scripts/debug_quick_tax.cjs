const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });

if (!admin.apps.length) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
        if (privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
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

async function checkKey() {
    const doc = await db.collection('metadata').doc('taxonomy').get();
    if (doc.exists) {
        const data = doc.data();
        console.log("bseb_12 exists?", !!data['bseb_12']);
        if (data['bseb_12']) {
            console.log("Subjects:", JSON.stringify(data['bseb_12'].subjects));
        } else {
            console.log("Keys available:", Object.keys(data));
        }
    } else {
        console.log("Taxonomy doc missing");
    }
}

checkKey().then(() => process.exit(0));
