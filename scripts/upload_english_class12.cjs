const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, writeBatch } = require('firebase/firestore');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
    console.error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const FILES_TO_PROCESS = [
    {
        filename: 'Class 12th BSEB english Prose (1).xlsx',
        section: 'Prose'
    },
    {
        filename: 'Class 12th BSEB english Poetry.xlsx',
        section: 'Poetry'
    }
];

async function uploadEnglishQuestions() {
    try {
        console.log("Starting Class 12 English Upload...");

        let totalUploaded = 0;
        const batchSize = 400;
        let batch = writeBatch(db);
        let operationCount = 0;

        for (const fileInfo of FILES_TO_PROCESS) {
            const filePath = path.join(process.cwd(), 'data', fileInfo.filename);

            if (!fs.existsSync(filePath)) {
                console.error(`File not found: ${filePath}, skipping...`);
                continue;
            }

            console.log(`Processing File: ${fileInfo.filename} using Section: ${fileInfo.section}`);

            const workbook = XLSX.readFile(filePath);

            for (const sheetName of workbook.SheetNames) {
                console.log(`  -> Sheet: ${sheetName}`);
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                for (const row of jsonData) {
                    // Extract fields
                    const questionText = row['Question'] || row['question'];
                    if (!questionText) continue;

                    // Parse Correct Answer
                    let rawAnswer = (row['Correct Answer'] || row['correct answer'] || row['Answer'] || '').toString().trim().toLowerCase();
                    let correctIndex = -1;

                    if (rawAnswer === 'a' || rawAnswer.startsWith('option a')) correctIndex = 0;
                    else if (rawAnswer === 'b' || rawAnswer.startsWith('option b')) correctIndex = 1;
                    else if (rawAnswer === 'c' || rawAnswer.startsWith('option c')) correctIndex = 2;
                    else if (rawAnswer === 'd' || rawAnswer.startsWith('option d')) correctIndex = 3;

                    // Fallback: check if the answer text matches an option exactly
                    const optionsList = [
                        (row['Option A'] || row['A'] || '').toString(),
                        (row['Option B'] || row['B'] || '').toString(),
                        (row['Option C'] || row['C'] || '').toString(),
                        (row['Option D'] || row['D'] || '').toString()
                    ];

                    if (correctIndex === -1) {
                        const preciseMatch = optionsList.findIndex(opt => opt.toLowerCase().trim() === rawAnswer);
                        if (preciseMatch !== -1) correctIndex = preciseMatch;
                    }

                    if (correctIndex === -1) {
                        // One last heuristic: sometimes answers are 'A)', 'B.', etc.
                        if (/^a[).]?$/.test(rawAnswer)) correctIndex = 0;
                        else if (/^b[).]?$/.test(rawAnswer)) correctIndex = 1;
                        else if (/^c[).]?$/.test(rawAnswer)) correctIndex = 2;
                        else if (/^d[).]?$/.test(rawAnswer)) correctIndex = 3;
                    }

                    if (correctIndex === -1) {
                        console.warn(`    Skipping invalid answer: "${rawAnswer}" in question: "${questionText.substring(0, 20)}..."`);
                        continue;
                    }

                    const chapterName = (row['Chapter'] || row['chapter'] || sheetName).toString().trim();

                    const newDocRef = doc(collection(db, 'questions'));
                    const qData = {
                        subject: 'english',
                        chapter: chapterName,
                        question: questionText,
                        options: optionsList,
                        correctAnswer: correctIndex,
                        board: 'bseb',
                        class: '12',
                        section: fileInfo.section, // Prose or Poetry
                        uploadedAt: new Date().toISOString()
                    };

                    batch.set(newDocRef, qData);
                    operationCount++;
                    totalUploaded++;

                    if (operationCount >= batchSize) {
                        await batch.commit();
                        batch = writeBatch(db);
                        operationCount = 0;
                        console.log(`    Committed batch. Total so far: ${totalUploaded}`);
                    }
                }
            }
        }

        if (operationCount > 0) {
            await batch.commit();
            console.log(`    Committed final batch. Total uploaded: ${totalUploaded}`);
        } else {
            console.log("    No final batch to commit.");
        }

        console.log("Done!");
        process.exit(0);

    } catch (e) {
        console.error("Fatal Error:", e);
        process.exit(1);
    }
}

uploadEnglishQuestions();
