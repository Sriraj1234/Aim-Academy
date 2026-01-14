const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

if (!admin.apps.length) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            })
        });
    } catch (error) { console.error(error); process.exit(1); }
}

const db = getFirestore();

async function listTaxonomyKeys() {
    console.log('Reading metadata/taxonomy...');
    const docRef = db.collection('metadata').doc('taxonomy');
    const doc = await docRef.get();

    if (doc.exists) {
        console.log('Taxonomy Keys Found:');
        console.log(Object.keys(doc.data()));
    } else {
        console.log('Taxonomy document does not exist.');
    }
}

listTaxonomyKeys();
