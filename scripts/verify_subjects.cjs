const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

if (!admin.apps.length) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
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

async function listSubjects() {
    const doc = await db.collection('metadata').doc('taxonomy').get();
    const data = doc.data();

    ['bseb_12_science', 'bseb_12_arts', 'bseb_12_commerce'].forEach(key => {
        if (data[key]) {
            console.log(`\nKEY: ${key}`);
            console.log('SUBJECTS:', JSON.stringify(data[key].subjects));
            console.log(`Has English in subjects: ${data[key].subjects.some(s => s.toLowerCase().includes('english'))}`);
            console.log('CHAPTERS:', Object.keys(data[key].chapters || {}));
        } else {
            console.log(`\nKEY: ${key} NOT FOUND`);
        }
    });
}

listSubjects();
