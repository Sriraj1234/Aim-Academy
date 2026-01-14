const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const path = require('path');
const xlsx = require('xlsx');
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

async function fixTaxonomy() {
    console.log('Fixing Taxonomy Structure for bseb_12...');

    // Get current chapter counts from DB
    const questionsRef = db.collection('questions');
    const chaptersMap = {};

    // Query all Class 12 questions and group by subject, section, chapter
    const snapshot = await questionsRef
        .where('board', '==', 'bseb')
        .where('class', '==', '12')
        .get();

    snapshot.forEach(doc => {
        const d = doc.data();
        const subject = d.subject;
        const section = d.section || 'General';
        const chapter = d.chapter;

        if (!subject || !chapter) return;

        if (!chaptersMap[subject]) chaptersMap[subject] = {};
        if (!chaptersMap[subject][chapter]) {
            chaptersMap[subject][chapter] = { name: chapter, section: section, count: 0 };
        }
        chaptersMap[subject][chapter].count++;
    });

    // Convert to flat arrays with section metadata
    const taxonomyChapters = {};
    for (const subject of Object.keys(chaptersMap)) {
        taxonomyChapters[subject] = Object.values(chaptersMap[subject]);
    }

    console.log('English Chapters:', taxonomyChapters['English']?.length || 0);
    console.log('Hindi Chapters:', taxonomyChapters['Hindi']?.length || 0);

    // Update taxonomy
    const taxonomyRef = db.collection('metadata').doc('taxonomy');
    await taxonomyRef.set({
        'bseb_12': {
            subjects: Object.keys(chaptersMap),
            chapters: taxonomyChapters
        }
    }, { merge: true });

    console.log('Taxonomy Fixed!');
}

fixTaxonomy().catch(console.error);
