const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc, writeBatch } = require('firebase/firestore');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Client SDK
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check config
if (!firebaseConfig.projectId) {
    console.error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local");
    process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadSanskrit() {
    try {
        console.log("Starting Sanskrit Upload (Client SDK)...");
        const filePath = path.join(process.cwd(), 'data', 'Class 10 sanskrit bihar board.xlsx');

        if (!fs.existsSync(filePath)) {
            console.error("File not found:", filePath);
            return;
        }

        const workbook = XLSX.readFile(filePath);
        const sheetNames = workbook.SheetNames;
        console.log("Found sheets:", sheetNames);

        let totalUploaded = 0;
        const batchSize = 400;
        let batch = writeBatch(db);
        let operationCount = 0;

        for (const sheetName of sheetNames) {
            console.log(`Processing sheet: ${sheetName}`);
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            for (const row of jsonData) {
                const questionText = row['Question'] || row['question'] || row['प्रश्न'];
                if (!questionText) continue;

                const chapter = (row['Chapter'] || row['chapter'] || sheetName).toString().trim();
                let rawAnswer = (row['Correct Answer'] || row['correct answer'] || row['Answer'] || '').toString().trim().toLowerCase();

                // Normalize Answer
                let correctAnswer = '';
                if (rawAnswer.match(/^(option )?a|विकल्प a/)) correctAnswer = 'a';
                else if (rawAnswer.match(/^(option )?b|विकल्प b/)) correctAnswer = 'b';
                else if (rawAnswer.match(/^(option )?c|विकल्प c/)) correctAnswer = 'c';
                else if (rawAnswer.match(/^(option )?d|विकल्प d/)) correctAnswer = 'd';

                // Fallbacks
                if (!correctAnswer) {
                    if (rawAnswer.includes('k') || rawAnswer.includes('क')) correctAnswer = 'a';
                    else if (rawAnswer.includes('kh') || rawAnswer.includes('ख')) correctAnswer = 'b';
                    else if (rawAnswer.includes('g') || rawAnswer.includes('ग')) correctAnswer = 'c';
                    else if (rawAnswer.includes('gh') || rawAnswer.includes('घ')) correctAnswer = 'd';
                }

                if (!correctAnswer) {
                    // Check against options text
                    const opts = [row['Option A'], row['Option B'], row['Option C'], row['Option D']];
                    const idx = opts.findIndex(o => o && o.toString().toLowerCase().trim() === rawAnswer);
                    if (idx !== -1) correctAnswer = ['a', 'b', 'c', 'd'][idx];
                }

                if (!correctAnswer) continue;

                const newDocRef = doc(collection(db, 'questions'));
                const qData = {
                    subject: 'sanskrit',
                    chapter: chapter,
                    question: questionText,
                    options: {
                        a: (row['Option A'] || row['A'] || '').toString(),
                        b: (row['Option B'] || row['B'] || '').toString(),
                        c: (row['Option C'] || row['C'] || '').toString(),
                        d: (row['Option D'] || row['D'] || '').toString()
                    },
                    correctAnswer: correctAnswer,
                    board: 'bseb',
                    class: '10',
                    createdAt: new Date().toISOString()
                };

                batch.set(newDocRef, qData);
                operationCount++;
                totalUploaded++;

                if (operationCount >= batchSize) {
                    await batch.commit();
                    batch = writeBatch(db);
                    operationCount = 0;
                    console.log(`Committed batch. Total: ${totalUploaded}`);
                }
            }
        }

        if (operationCount > 0) {
            await batch.commit();
            console.log(`Committed final batch. Total: ${totalUploaded}`);
        }

        console.log("DONE. Total Questions Uploaded:", totalUploaded);
    } catch (e) {
        console.error("Upload Script Error:", e);
    }
}

uploadSanskrit();
