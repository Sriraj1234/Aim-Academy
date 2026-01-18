const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const dotenv = require('dotenv');

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
const TAXONOMY_DOC_ID = 'taxonomy'; // Document ID in 'metadata' collection
const TAXONOMY_FIELD_KEY = 'bseb_12_science'; // Field to update
const SUBJECT_KEY = 'Chemistry';

// --- Main Logic ---
async function updateTaxonomy() {
    console.log(`Reading file: ${FILE_PATH}`);

    if (!fs.existsSync(FILE_PATH)) {
        console.error(`File not found: ${FILE_PATH}`);
        return;
    }

    const workbook = XLSX.readFile(FILE_PATH);
    const sheetNames = workbook.SheetNames;
    const chapterCounts = {};

    console.log("Analyzing Excel file for chapters...");

    for (const sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet);

        for (const row of rows) {
            const chapter = row['Chapter'] ? row['Chapter'].trim() : null;
            if (chapter) {
                chapterCounts[chapter] = (chapterCounts[chapter] || 0) + 1;
            }
        }
    }

    console.log("\nChapter Counts found:");
    console.log(chapterCounts);

    const newChaptersArray = Object.keys(chapterCounts).map(name => ({
        name: name,
        count: chapterCounts[name]
    }));

    // Sort chapters alphabetically or by some logic? 
    // Usually alphabetical or maintaining insertion order is fine.
    // Let's sort alphabetically for basic consistency.
    newChaptersArray.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`\nPrepared ${newChaptersArray.length} chapters for update.`);

    // --- Update Firestore ---
    const taxonomyRef = db.collection('metadata').doc(TAXONOMY_DOC_ID);

    try {
        const doc = await taxonomyRef.get();
        if (!doc.exists) {
            console.error("Taxonomy document not found!");
            return;
        }

        const data = doc.data();
        if (!data[TAXONOMY_FIELD_KEY]) {
            console.error(`Field ${TAXONOMY_FIELD_KEY} not found in taxonomy!`);
            return;
        }

        // Deep update structure
        // We only want to update bseb_12_science.chapters.Chemistry
        // To be safe, we read, modify specifically that part, and write back.

        // Ensure chapters object exists
        if (!data[TAXONOMY_FIELD_KEY].chapters) {
            data[TAXONOMY_FIELD_KEY].chapters = {};
        }

        // Update Chemistry
        data[TAXONOMY_FIELD_KEY].chapters[SUBJECT_KEY] = newChaptersArray;

        // Also ensure 'Chemistry' is in the subjects list if not already
        if (!data[TAXONOMY_FIELD_KEY].subjects.includes(SUBJECT_KEY)) {
            data[TAXONOMY_FIELD_KEY].subjects.push(SUBJECT_KEY);
        }

        await taxonomyRef.update({
            [TAXONOMY_FIELD_KEY]: data[TAXONOMY_FIELD_KEY]
        });

        console.log("\n✅ Taxonomy updated successfully!");

    } catch (error) {
        console.error("Error updating taxonomy:", error);
    }
}

updateTaxonomy();
