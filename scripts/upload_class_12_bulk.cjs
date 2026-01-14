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

// Map "Option A" -> index 0, etc.
const OPTION_INDEX = {
    'Option A': 0, 'option a': 0, 'A': 0, 'a': 0,
    'Option B': 1, 'option b': 1, 'B': 1, 'b': 1,
    'Option C': 2, 'option c': 2, 'C': 2, 'c': 2,
    'Option D': 3, 'option d': 3, 'D': 3, 'd': 3,
};

// FILE DEFINITIONS with section info
const FILES = [
    { path: 'data/Class 12th BSEB english Prose (1).xlsx', subject: 'English', section: 'Prose' },
    { path: 'data/Class 12th BSEB english Poetry.xlsx', subject: 'English', section: 'Poetry' },
    { path: 'data/Class 12th BSEB Hindi Prose.xlsx', subject: 'Hindi', section: 'Prose' },
    { path: 'data/Class 12th BSEB Hindi Poetry.xlsx', subject: 'Hindi', section: 'Poetry' },
];

async function uploadQuestions() {
    console.log('Starting Class 12 BSEB Bulk Upload (Index Format)...');
    let totalUploaded = 0;
    const chapterCounts = {};

    for (const fileDef of FILES) {
        console.log(`\nProcessing: ${fileDef.path}`);
        const workbook = xlsx.readFile(path.join(__dirname, '..', fileDef.path));

        for (const sheetName of workbook.SheetNames) {
            console.log(`  Sheet: ${sheetName}`);
            const sheet = workbook.Sheets[sheetName];
            const rows = xlsx.utils.sheet_to_json(sheet);

            if (rows.length === 0) continue;

            const batch = db.batch();
            let batchCount = 0;

            for (const row of rows) {
                const question = row['Question'];
                const chapter = row['Chapter'] || sheetName;
                const optionA = row['Option A'];
                const optionB = row['Option B'];
                const optionC = row['Option C'];
                const optionD = row['Option D'];
                const correctAnswerRaw = row['Correct Answer'];

                if (!question || !optionA) continue;

                const options = [optionA, optionB, optionC, optionD].map(o => (o || '').toString().trim());

                // Convert "Option B" -> index number (0, 1, 2, 3)
                const trimmedAnswer = (correctAnswerRaw || '').toString().trim();
                let correctAnswer = OPTION_INDEX[trimmedAnswer];

                // If not found, default to 0
                if (correctAnswer === undefined) {
                    correctAnswer = 0;
                    console.warn(`    Warning: Unknown answer format "${trimmedAnswer}", defaulting to 0`);
                }

                const docRef = db.collection('questions').doc();
                batch.set(docRef, {
                    board: 'bseb',
                    class: '12',
                    subject: fileDef.subject,
                    section: fileDef.section,
                    chapter: chapter.trim(),
                    question: question.toString().trim(),
                    options: options,
                    correctAnswer: correctAnswer,  // INDEX NUMBER
                    explanation: '',
                    createdAt: FieldValue.serverTimestamp()
                });
                batchCount++;

                // Track chapters for taxonomy
                const key = `${fileDef.subject}`;
                if (!chapterCounts[key]) chapterCounts[key] = {};
                if (!chapterCounts[key][chapter.trim()]) {
                    chapterCounts[key][chapter.trim()] = { name: chapter.trim(), section: fileDef.section, count: 0 };
                }
                chapterCounts[key][chapter.trim()].count++;
            }

            if (batchCount > 0) {
                await batch.commit();
                totalUploaded += batchCount;
                console.log(`    Uploaded ${batchCount} questions.`);
            }
        }
    }

    console.log(`\n--- Total Uploaded: ${totalUploaded} questions ---`);

    // --- REBUILD TAXONOMY ---
    console.log('\nRebuilding Taxonomy for bseb_12...');
    const taxonomyRef = db.collection('metadata').doc('taxonomy');

    const taxonomyChapters = {};
    for (const subject of Object.keys(chapterCounts)) {
        taxonomyChapters[subject] = Object.values(chapterCounts[subject]);
    }

    await taxonomyRef.set({
        'bseb_12': {
            subjects: Object.keys(chapterCounts),
            chapters: taxonomyChapters
        }
    }, { merge: true });

    console.log('Taxonomy Rebuilt!');
    console.log('English Chapters:', taxonomyChapters['English']?.length || 0);
    console.log('Hindi Chapters:', taxonomyChapters['Hindi']?.length || 0);
}

uploadQuestions().catch(console.error);
