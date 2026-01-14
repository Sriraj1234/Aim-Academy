const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function getChaptersFromExcel(filename) {
    const filePath = path.join(process.cwd(), 'data', filename);
    if (!fs.existsSync(filePath)) return [];

    const workbook = XLSX.readFile(filePath);
    const chapters = new Set();

    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        data.forEach(row => {
            const ch = row['Chapter'] || row['chapter'];
            if (ch) chapters.add(ch.toString().trim());
        });
        // If no chapter column, maybe use sheet name? 
        // But per previous inspection, chapter column exists.
    });

    return Array.from(chapters).map(name => ({
        name,
        count: 10, // Placeholder
        section: filename.toLowerCase().includes('poetry') ? 'Poetry' : 'Prose'
    }));
}

async function updateTaxonomy() {
    try {
        console.log("Extracting English Chapters...");
        const proseChapters = getChaptersFromExcel('Class 12th BSEB english Prose (1).xlsx');
        const poetryChapters = getChaptersFromExcel('Class 12th BSEB english Poetry.xlsx');
        const englishChapters = [...proseChapters, ...poetryChapters];

        console.log(`Found ${englishChapters.length} English chapters.`);

        console.log("Extracting Hindi Chapters...");
        const hindiProse = getChaptersFromExcel('Class 12th BSEB Hindi Prose.xlsx');
        const hindiPoetry = getChaptersFromExcel('Class 12th BSEB Hindi Poetry.xlsx');
        const hindiChapters = [...hindiProse, ...hindiPoetry];

        console.log(`Found ${hindiChapters.length} Hindi chapters.`);

        // Define Base Subjects for Streams
        const scienceSubjects = ['Physics', 'Chemistry', 'Biology', 'Math', 'English', 'Hindi'];
        const commerceSubjects = ['Accountancy', 'Economics', 'Business Studies', 'English', 'Hindi'];
        const artsSubjects = ['History', 'Geography', 'Political Science', 'Economics', 'English', 'Hindi'];

        const docRef = doc(db, 'metadata', 'taxonomy');
        const docSnap = await getDoc(docRef);
        const currentData = docSnap.exists() ? docSnap.data() : {};

        const updates = {
            ...currentData
        };

        const updateStream = (key, subjects) => {
            if (!updates[key]) updates[key] = { subjects: [], chapters: {} };

            // Merge subjects
            const existingSubjects = new Set(updates[key].subjects);
            subjects.forEach(s => existingSubjects.add(s));
            updates[key].subjects = Array.from(existingSubjects);

            // Update English Chapters
            if (!updates[key].chapters['English']) updates[key].chapters['English'] = [];
            // Merge English chapters (avoid duplicates by name)
            const existEng = new Set(updates[key].chapters['English'].map(c => c.name));
            englishChapters.forEach(c => {
                if (!existEng.has(c.name)) {
                    updates[key].chapters['English'].push(c);
                    existEng.add(c.name);
                }
            });

            // Update Hindi Chapters
            if (!updates[key].chapters['Hindi']) updates[key].chapters['Hindi'] = [];
            const existHin = new Set(updates[key].chapters['Hindi'].map(c => c.name));
            hindiChapters.forEach(c => {
                if (!existHin.has(c.name)) {
                    updates[key].chapters['Hindi'].push(c);
                    existHin.add(c.name);
                }
            });
        };

        updateStream('bseb_12_science', scienceSubjects);
        updateStream('bseb_12_commerce', commerceSubjects);
        updateStream('bseb_12_arts', artsSubjects);

        console.log("Updating Firestore...");
        await setDoc(docRef, updates);
        console.log("SUCCESS: Taxonomy Updated.");
        process.exit(0);

    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

updateTaxonomy();
