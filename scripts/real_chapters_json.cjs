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

async function listChaptersJSON() {
    const snapshot = await db.collection('questions')
        .where('class', '==', '12')
        .where('board', '==', 'bseb')
        .select('subject', 'chapter')
        .get();

    const subjects = {};

    snapshot.forEach(doc => {
        const data = doc.data();
        let sub = data.subject || 'Unknown';

        // Log raw subject for debugging
        if (!subjects[sub]) subjects[sub] = new Set();
        if (data.chapter) {
            subjects[sub].add(data.chapter.trim());
        }
    });

    const fs = require('fs');

    // Find Hindi/English by flexible matching
    const englishKey = Object.keys(subjects).find(k => k.toLowerCase().includes('english')) || 'English';
    const hindiKey = Object.keys(subjects).find(k => k.toLowerCase().includes('hindi')) || 'Hindi';

    const output = {
        english_key: englishKey,
        hindi_key: hindiKey,
        english_chapters: Array.from(subjects[englishKey] || []).sort(),
        hindi_chapters: Array.from(subjects[hindiKey] || []).sort(),
        all_subjects: Object.keys(subjects)
    };

    fs.writeFileSync(path.join(__dirname, 'final_chapters.json'), JSON.stringify(output, null, 2));
    console.log('Written to final_chapters.json');
}

listChaptersJSON();
