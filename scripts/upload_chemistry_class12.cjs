const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const dotenv = require('dotenv');
const crypto = require('crypto');

// --- Firebase Initialization ---
try {
    const envPathLocal = path.join(__dirname, '..', '.env.local');
    const envPath = path.join(__dirname, '..', '.env');

    dotenv.config({ path: envPath });
    dotenv.config({ path: envPathLocal, override: true });

    if (!admin.apps.length) {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (!privateKey) {
            console.error("FIREBASE_PRIVATE_KEY not found!");
            process.exit(1);
        }
        if (privateKey.includes('\\n')) {
            privateKey = privateKey.replace(/\\n/g, '\n');
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            })
        });
    }
} catch (e) {
    console.error("Error initializing Firebase:", e);
    process.exit(1);
}

const db = admin.firestore();

// --- Configuration ---
const FILE_PATH = path.join(__dirname, '../data/Class 12th BSEB Chemistry questions (1).xlsx');
const BOARD = 'Bihar Board';
const CLASS_LEVEL = 'Class 12';
const STREAM = 'Science';
const DEFAULT_SUBJECT = 'Chemistry';
const BATCH_SIZE = 50; // Parallel writes count

// --- Helpers ---
function generateId(data) {
    const content = `${data.board}-${data.class}-${data.stream}-${data.subject}-${data.chapter}-${data.question}`;
    return crypto.createHash('md5').update(content).digest('hex');
}

async function processBatch(batch) {
    const promises = batch.map(async (item) => {
        const docRef = db.collection('questions').doc(item.id);
        const { id, ...data } = item;
        try {
            await docRef.set(data, { merge: true });
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message, item };
        }
    });
    return Promise.all(promises);
}

// --- Main Upload Logic ---
async function uploadQuestions() {
    console.log(`Reading file: ${FILE_PATH}`);

    if (!fs.existsSync(FILE_PATH)) {
        console.error(`File not found: ${FILE_PATH}`);
        return;
    }

    const workbook = XLSX.readFile(FILE_PATH);
    const sheetNames = workbook.SheetNames;
    console.log(`Found ${sheetNames.length} sheets:`, sheetNames);

    let totalUploaded = 0;
    let totalErrors = 0;

    for (const sheetName of sheetNames) {
        console.log(`\nProcessing sheet: ${sheetName}`);
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet);

        console.log(`  Found ${rows.length} rows.`);

        let currentBatch = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            const subject = row['Subject'] ? row['Subject'].trim() : DEFAULT_SUBJECT;
            const chapter = row['Chapter'] ? row['Chapter'].trim() : null;
            const questionText = row['Question'];
            const optionA = row['Option A'];
            const optionB = row['Option B'];
            const optionC = row['Option C'];
            const optionD = row['Option D'];
            const correctAnsRaw = row['Correct Answer'];

            if (!questionText || !correctAnsRaw || !chapter) continue;

            let correctAnswer = correctAnsRaw.toString().trim();

            if (correctAnswer.toUpperCase() === 'A' || correctAnswer.toUpperCase() === 'OPTION A') correctAnswer = optionA;
            else if (correctAnswer.toUpperCase() === 'B' || correctAnswer.toUpperCase() === 'OPTION B') correctAnswer = optionB;
            else if (correctAnswer.toUpperCase() === 'C' || correctAnswer.toUpperCase() === 'OPTION C') correctAnswer = optionC;
            else if (correctAnswer.toUpperCase() === 'D' || correctAnswer.toUpperCase() === 'OPTION D') correctAnswer = optionD;

            const docData = {
                board: BOARD,
                class: CLASS_LEVEL,
                stream: STREAM,
                subject: subject,
                chapter: chapter,
                question: questionText,
                options: [optionA, optionB, optionC, optionD].filter(o => o !== undefined && o !== null),
                correctAnswer: correctAnswer,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                source: 'excel_upload_jan_2026'
            };

            // Add ID for batch processing
            docData.id = generateId(docData);
            currentBatch.push(docData);

            if (currentBatch.length >= BATCH_SIZE) {
                process.stdout.write('B'); // Batch indicator
                const results = await processBatch(currentBatch);
                results.forEach(r => {
                    if (r.success) totalUploaded++;
                    else {
                        console.error(`Error: ${r.error}`);
                        totalErrors++;
                    }
                });
                currentBatch = [];
            }
        }

        // Process remaining
        if (currentBatch.length > 0) {
            process.stdout.write('b');
            const results = await processBatch(currentBatch);
            results.forEach(r => {
                if (r.success) totalUploaded++;
                else {
                    console.error(`Error: ${r.error}`);
                    totalErrors++;
                }
            });
        }
    }

    console.log(`\n\nUpload Complete!`);
    console.log(`Total Uploaded: ${totalUploaded}`);
    console.log(`Total Errors: ${totalErrors}`);
}

uploadQuestions();
