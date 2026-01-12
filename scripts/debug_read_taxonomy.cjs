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

async function readTaxonomy() {
    const doc = await db.collection('metadata').doc('taxonomy').get();
    if (!doc.exists) {
        console.log("No taxonomy found!");
    } else {
        const data = doc.data();
        console.log("Taxonomy keys:", Object.keys(data));
        console.log("BSEB 12 Data:", JSON.stringify(data['bseb_12'] || "MISSING", null, 2));
    }
}

readTaxonomy().then(() => process.exit(0));
