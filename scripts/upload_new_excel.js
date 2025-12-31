
const XLSX = require('xlsx');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, writeBatch, doc, getDocs } = require('firebase/firestore');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Check for required env vars
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

if (!firebaseConfig.apiKey) {
    console.error("Missing Firebase API Key in .env.local");
    process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// File Path
const FILE_PATH = path.join(__dirname, '../data/Social Science class10 bseb fixed.xlsx');

async function uploadData() {
    console.log(`Starting upload from: ${FILE_PATH}`);

    if (!fs.existsSync(FILE_PATH)) {
        console.error("File not found!");
        process.exit(1);
    }

    // 1. Fetch Existing Questions to Prevent Duplicates
    console.log("Fetching existing questions to check for duplicates...");
    const existingQuestions = new Set();
    try {
        const querySnapshot = await getDocs(collection(db, 'questions'));
        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.question) {
                // Normalize text for comparison (trim, lowercase)
                const normalizedQ = data.question.toLowerCase().trim().replace(/\s+/g, ' ');
                existingQuestions.add(normalizedQ);
            }
        });
        console.log(`Loaded ${existingQuestions.size} existing questions.`);
    } catch (err) {
        console.error("Error fetching existing questions:", err);
        process.exit(1);
    }

    const workbook = XLSX.readFile(FILE_PATH);
    const sheetNames = workbook.SheetNames;
    console.log(`Found ${sheetNames.length} sheets. Processing all...`);

    const batchSize = 400;
    let batch = writeBatch(db);
    let count = 0;
    let totalUploaded = 0;
    let skippedCount = 0;

    // We also need to track duplicates WITHIN the file itself across sheets
    const newQuestionsSet = new Set();

    for (const sheetName of sheetNames) {
        console.log(`Processing Sheet: "${sheetName}"`);
        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet);

        for (const row of rawData) {
            // Skip empty rows
            const rawQuestion = row['Question'];
            if (!rawQuestion) continue;

            const normalizedQ = rawQuestion.toString().toLowerCase().trim().replace(/\s+/g, ' ');

            // Check if already in DB
            if (existingQuestions.has(normalizedQ)) {
                skippedCount++;
                continue;
            }

            // Check if already staged in this run (duplicate within file)
            if (newQuestionsSet.has(normalizedQ)) {
                skippedCount++;
                continue;
            }

            // Mark as seen
            newQuestionsSet.add(normalizedQ);

            const options = [
                row['Option A']?.toString() || '',
                row['Option B']?.toString() || '',
                row['Option C']?.toString() || '',
                row['Option D']?.toString() || ''
            ];

            // Determine correct answer index
            const correctVal = row['Correct Answer']?.toString().trim();
            let correctIndex = -1;

            if (correctVal) {
                const lowerCorrect = correctVal.toLowerCase();

                // Check direct mapping (A, B, C, D)
                const map = { 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
                if (map.hasOwnProperty(lowerCorrect)) {
                    correctIndex = map[lowerCorrect];
                }
                // Check formatted strings (Option A, Option B...)
                else if (lowerCorrect.startsWith('option a')) correctIndex = 0;
                else if (lowerCorrect.startsWith('option b')) correctIndex = 1;
                else if (lowerCorrect.startsWith('option c')) correctIndex = 2;
                else if (lowerCorrect.startsWith('option d')) correctIndex = 3;
                // Check exact text fuzzy match
                else {
                    const targetText = correctVal.toLowerCase().replace(/\s+/g, ' ').trim();
                    const exactMatchIdx = options.findIndex(opt => opt.toLowerCase().trim() === correctVal.toLowerCase().trim());
                    if (exactMatchIdx !== -1) {
                        correctIndex = exactMatchIdx;
                    } else {
                        const containMatchIdx = options.findIndex(opt => {
                            const optText = opt.toString().toLowerCase().trim();
                            return optText === targetText || (targetText.length > 5 && optText.includes(targetText));
                        });
                        if (containMatchIdx !== -1) correctIndex = containMatchIdx;
                    }
                }
            }

            if (correctIndex === -1) {
                console.warn(`[WARN] Unknown Answer Index (-1). Sheet: ${sheetName}. Q: "${rawQuestion.substring(0, 20)}..." Ans: "${correctVal}"`);
            }

            // Construct Question Object
            const subject = row['Subject'] || row['Main Subject'] || 'Social Science';

            const questionData = {
                question: rawQuestion,
                options: options,
                correctAnswer: correctIndex,
                subject: subject.trim(),
                chapter: (row['Chapter'] || 'Uncategorized').trim(),
                board: 'bseb',
                class: '10',
                language: 'hindi',
                difficulty: 'medium',
                type: 'mcq',
                createdAt: new Date().toISOString(),
                sourceFile: 'Social Science class10 bseb fixed.xlsx',
                sheetName: sheetName
            };

            // Create a new document reference
            const docRef = doc(collection(db, 'questions'));
            batch.set(docRef, questionData);

            count++;
            if (count >= batchSize) {
                await batch.commit();
                totalUploaded += count;
                console.log(`Uploaded batch of ${count}. Total so far: ${totalUploaded}`);
                batch = writeBatch(db);
                count = 0;
            }
        }
    }

    // Commit remaining
    if (count > 0) {
        await batch.commit();
        totalUploaded += count;
        console.log(`Uploaded final batch of ${count}.`);
    }

    console.log(`Upload Complete!`);
    console.log(`- New Documents Added: ${totalUploaded}`);
    console.log(`- Duplicates Skipped: ${skippedCount}`);
    process.exit(0);
}

uploadData().catch(err => {
    console.error("Upload failed:", err);
    process.exit(1);
});
