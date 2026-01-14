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

async function inspectHindi() {
    console.log('Searching for any ques with "hindi" in subject...');
    // We can't do a partial text search in firestore easily. 
    // We will scan a batch of 100 questions from class 12 bseb and print their subjects.

    const snapshot = await db.collection('questions')
        .where('class', '==', '12')
        .where('board', '==', 'bseb')
        .limit(200)
        .get();

    const seenSubjects = new Set();
    snapshot.forEach(doc => {
        const s = doc.data().subject;
        if (s) seenSubjects.add(s);
    });

    console.log('Subjects found in first 200 docs:', Array.from(seenSubjects));
}

inspectHindi();
