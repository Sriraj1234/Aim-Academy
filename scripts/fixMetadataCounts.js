const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } = require('firebase/firestore');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Configuration
// We'll target BSEB Class 10 Math specifically as that's what the user uploaded
const TARGET_BOARD = 'bseb';
const TARGET_CLASS = '10';
const TARGET_SUBJECTS = ['mathematics', 'math', 'maths'];

// Initialize Firebase
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
    console.error('Error: Firebase credentials not found');
    process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
    console.log('=== Fix Metadata Counts Script ===');
    console.log(`Target: ${TARGET_BOARD.toUpperCase()} Class ${TARGET_CLASS} - Math`);

    // 1. Fetch all Math Questions
    console.log('Fetching questions count from database...');
    const qRef = collection(db, 'questions');
    const q = query(
        qRef,
        where('board', '==', TARGET_BOARD),
        where('class', '==', TARGET_CLASS),
        where('subject', 'in', TARGET_SUBJECTS)
    );

    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.size} total questions.`);

    if (snapshot.empty) {
        console.log('No questions found. Exiting.');
        process.exit(0);
    }

    // 2. Aggregate Counts by Chapter
    const counts = {};
    let targetSubject = 'mathematics'; // Default, will update if mixed

    snapshot.forEach(doc => {
        const data = doc.data();
        const ch = data.chapter;
        if (ch) {
            // Normalize chapter name? Ideally strict match to what's in DB
            counts[ch] = (counts[ch] || 0) + 1;
        }
        // Capture the most frequent subject name to identify metadata key
        // This is a heuristic, but usually effective
        if (data.subject) targetSubject = data.subject;
    });

    console.log('\nCalculated Counts per Chapter:');
    Object.entries(counts).forEach(([ch, count]) => {
        console.log(`  - ${ch}: ${count}`);
    });

    // 3. Update Metadata
    console.log('\nFetching Metadata...');
    const metaRef = doc(db, 'metadata', 'taxonomy');
    const metaSnap = await getDoc(metaRef);

    if (!metaSnap.exists()) {
        console.error('Metadata document not found!');
        process.exit(1);
    }

    const metaData = metaSnap.data();
    const key = `${TARGET_BOARD}_${TARGET_CLASS}`; // 'bseb_10'

    if (!metaData[key]) {
        console.error(`Metadata key '${key}' not found!`);
        process.exit(1);
    }

    // Find the actual subject key being used in metadata
    // Check our TARGET_SUBJECTS to see which one exists in chapters
    let metaSubjectKey = null;
    if (metaData[key].chapters) {
        for (const s of TARGET_SUBJECTS) {
            if (metaData[key].chapters[s]) {
                metaSubjectKey = s;
                break;
            }
        }
    }

    // If not found, look for fuzzy match or default to 'mathematics'
    if (!metaSubjectKey) {
        console.log(`Subject key not found in metadata chapters. Creating 'mathematics'...`);
        metaSubjectKey = 'mathematics';
        if (!metaData[key].chapters) metaData[key].chapters = {};
        if (!metaData[key].chapters[metaSubjectKey]) metaData[key].chapters[metaSubjectKey] = [];
    } else {
        console.log(`Updating subject key: '${metaSubjectKey}'`);
    }

    // 4. Update the Array
    const currentList = metaData[key].chapters[metaSubjectKey] || [];

    // Convert all to objects and update counts
    // We start with what's in DB counts to ensure we capture everything
    // But we also want to preserve any chapters that might be in metadata but temporarily have 0 questions (optional)
    // For now, let's rebuild based on DB counts + existing items

    const updatedList = [];
    const processedChapters = new Set();

    // First, update existing entries
    currentList.forEach(item => {
        const name = typeof item === 'string' ? item : item.name;
        // If we have a count from DB, use it. If not, it means 0 questions for that chapter.
        const dbCount = counts[name] || 0;

        updatedList.push({
            name: name,
            count: dbCount
        });
        processedChapters.add(name);
    });

    // Second, add any chapters from DB that weren't in metadata
    Object.entries(counts).forEach(([name, count]) => {
        if (!processedChapters.has(name)) {
            console.log(`Adding missing chapter to metadata: ${name}`);
            updatedList.push({
                name: name,
                count: count
            });
        }
    });

    // Sort alphabetically (optional but nice)
    // updatedList.sort((a, b) => a.name.localeCompare(b.name));

    metaData[key].chapters[metaSubjectKey] = updatedList;

    // 5. Commit
    console.log('\nSaving to Firestore...');
    await setDoc(metaRef, metaData);
    console.log('✅ Metadata updated successfully!');
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
