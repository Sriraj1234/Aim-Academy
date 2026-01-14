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

async function findAnyHindi() {
    console.log('Searching GLOBAL for subject containing "hindi"...');
    // Cannot do global subject query easily without index or huge read.
    // We will sample recent additions (if possible) or just a large batch.

    // Attempt 1: Try exact match on 'Hindi'
    let snapshot = await db.collection('questions').where('subject', '==', 'Hindi').limit(5).get();
    if (snapshot.empty) snapshot = await db.collection('questions').where('subject', '==', 'hindi').limit(5).get();

    if (!snapshot.empty) {
        console.log('Found Hindi questions (Exact Match)!');
        snapshot.forEach(doc => {
            const d = doc.data();
            console.log(`MATCH: [${doc.id}] Board: ${d.board}, Class: ${d.class}, Subject: ${d.subject}`);
        });
        return;
    }

    console.log('No exact match for Hindi/hindi. Checking first 1000 docs for fuzzy match...');
    snapshot = await db.collection('questions').limit(1000).get();
    let found = false;
    snapshot.forEach(doc => {
        const d = doc.data();
        if (d.subject && d.subject.toLowerCase().includes('hindi')) {
            console.log(`MATCH: [${doc.id}] Board: ${d.board}, Class: ${d.class}, Subject: ${d.subject}, Chapter: ${d.chapter}`);
            found = true;
        }
    });

    if (!found) console.log('STILL NO HINDI QUESTIONS FOUND IN SAMPLE.');
}

findAnyHindi();
