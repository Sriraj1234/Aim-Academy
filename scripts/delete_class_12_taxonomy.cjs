const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
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

async function deleteClass12Taxonomy() {
    console.log('Deleting Class 12 Taxonomy keys...');
    const docRef = db.collection('metadata').doc('taxonomy');

    try {
        await docRef.update({
            'bseb_12': FieldValue.delete(),
            'bseb_12_science': FieldValue.delete(),
            'bseb_12_arts': FieldValue.delete(),
            'bseb_12_commerce': FieldValue.delete()
        });
        console.log('Successfully deleted bseb_12 and all bseb_12_* streams from taxonomy.');
    } catch (error) {
        console.error('Error deleting taxonomy keys:', error);
    }
}

deleteClass12Taxonomy();
