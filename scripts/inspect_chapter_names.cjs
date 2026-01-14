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

async function checkEnglishChapters() {
    console.log('Fetching English chapters to check for whitespace...');
    // We already know subject is 'english' (lowercase) or 'English'
    const snapshot = await db.collection('questions')
        .where('class', '==', '12')
        .limit(200) // Sample enough to get all chapters
        .get();

    const chapters = new Set();
    snapshot.forEach(doc => {
        const d = doc.data();
        if (d.subject && d.subject.toLowerCase() === 'english') {
            chapters.add(d.chapter);
        }
    });

    console.log('\n--- ENGLISH CHAPTER ANALYSIS ---');
    chapters.forEach(ch => {
        if (ch) {
            console.log(`"${ch}" (Length: ${ch.length})`);
        } else {
            console.log('<undefined chapter>');
        }
    });
}

checkEnglishChapters();
