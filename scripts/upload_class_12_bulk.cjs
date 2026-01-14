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

// FILE DEFINITIONS
const FILES = [
    { path: 'data/Class 12th BSEB english Prose (1).xlsx', subject: 'English', section: 'Prose' },
    { path: 'data/Class 12th BSEB english Poetry.xlsx', subject: 'English', section: 'Poetry' },
    { path: 'data/Class 12th BSEB Hindi Prose.xlsx', subject: 'Hindi', section: 'Prose' },
    { path: 'data/Class 12th BSEB Hindi Poetry.xlsx', subject: 'Hindi', section: 'Poetry' },
];

async function uploadQuestions() {
    console.log('Starting Class 12 BSEB Bulk Upload...');
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
                const chapter = row['Chapter'] || sheetName; // Use sheet name as fallback chapter
                const optionA = row['Option A'];
                const optionB = row['Option B'];
                const optionC = row['Option C'];
                const optionD = row['Option D'];
                const correctAnswer = row['Correct Answer'];

                if (!question || !optionA) continue; // Skip invalid rows

                const docRef = db.collection('questions').doc();
                batch.set(docRef, {
                    board: 'bseb',
                    class: '12',
                    subject: fileDef.subject,
                    section: fileDef.section,
                    chapter: chapter.trim(),
                    question: question.trim(),
                    options: [optionA, optionB, optionC, optionD].map(o => (o || '').toString().trim()),
                    correctAnswer: correctAnswer ? correctAnswer.toString().trim() : '',
                    createdAt: FieldValue.serverTimestamp()
                });
                batchCount++;

                // Track chapters for taxonomy
                const key = `${fileDef.subject}_${fileDef.section}`;
                if (!chapterCounts[key]) chapterCounts[key] = new Set();
                chapterCounts[key].add(chapter.trim());
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

    const taxonomyData = {
        subjects: ['English', 'Hindi'],
        chapters: {
            'English': {
                'Prose': Array.from(chapterCounts['English_Prose'] || []),
                'Poetry': Array.from(chapterCounts['English_Poetry'] || [])
            },
            'Hindi': {
                'Prose': Array.from(chapterCounts['Hindi_Prose'] || []),
                'Poetry': Array.from(chapterCounts['Hindi_Poetry'] || [])
            }
        }
    };

    await taxonomyRef.set({ 'bseb_12': taxonomyData }, { merge: true });
    console.log('Taxonomy Rebuilt!');
    console.log('Chapters found:');
    console.log(JSON.stringify(taxonomyData.chapters, null, 2));
}

uploadQuestions().catch(console.error);
