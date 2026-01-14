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

async function getRealChapters() {
    console.log('Scanning questions for unique chapters...');

    // We need to scan all Class 12 questions. 
    // Since we can't easily "group by" in Firestore, we'll fetch ID and Chapter for all Class 12 questions.
    // This might be large (6000+ docs), so we'll do it carefully.

    const snapshot = await db.collection('questions')
        .where('class', '==', '12')
        .where('board', '==', 'bseb') // assuming bseb based on conversation
        .select('subject', 'chapter')
        .get();

    console.log(`Fetched ${snapshot.size} questions for BSEB Class 12.`);

    const subjects = {};

    snapshot.forEach(doc => {
        const data = doc.data();
        let sub = data.subject || 'Unknown';

        // Normalize Subject Name (Title Case)
        sub = sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase();

        if (!subjects[sub]) subjects[sub] = new Set();
        if (data.chapter) {
            subjects[sub].add(data.chapter.trim());
        }
    });

    console.log('\n--- Real Chapters from Database ---');
    for (const [sub, chapters] of Object.entries(subjects)) {
        if (sub === 'English' || sub === 'Hindi') {
            console.log(`\nSubject: ${sub}`);
            console.log(`Unique Chapters Count: ${chapters.size}`);
            console.log('Chapters:', Array.from(chapters).sort());
        }
    }
}

getRealChapters();
