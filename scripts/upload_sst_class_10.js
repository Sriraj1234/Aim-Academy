const XLSX = require('xlsx');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, writeBatch, getDocs, setDoc, query, limit } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

const firebaseConfig = {
    apiKey: "AIzaSyCPEYMTsNAShOtfXYZcllBl_Vm6suY8TTY",
    authDomain: "aim-83922.firebaseapp.com",
    projectId: "aim-83922",
    storageBucket: "aim-83922.firebasestorage.app",
    messagingSenderId: "134379665002",
    appId: "1:134379665002:web:34f8abf08f3c3655967c13",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const FILE_PATH = path.join(__dirname, '../data/Class 10 SST BSEB.xlsx');
const TARGET_BOARD = 'bseb';
const TARGET_CLASS = '10';
const VALID_SUBJECTS = ['hindi', 'english', 'math', 'mathematics', 'science', 'social science', 'sst', 'sanskrit', 'urdu', 'physics', 'chemistry', 'biology', 'history', 'geography', 'civics', 'economics', 'polity', 'political science'];

async function main() {
    console.log(`Starting upload for ${FILE_PATH}...`);

    try {
        if (!fs.existsSync(FILE_PATH)) {
            console.error("File not found!");
            return;
        }

        const workbook = XLSX.readFile(FILE_PATH);
        let allQuestions = [];

        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet);
            console.log(`Sheet "${sheetName}": ${json.length} rows.`);
            allQuestions = [...allQuestions, ...json];
        });

        console.log(`Total rows found: ${allQuestions.length}`);

        // Helper to find value
        const getValue = (row, patterns) => {
            // Safety check for null/undefined row
            if (!row || typeof row !== 'object') return undefined;

            const rowKeys = Object.keys(row);
            for (const pattern of patterns) {
                if (row[pattern] !== undefined) return row[pattern];
                const p = pattern.toLowerCase().replace(/[^a-z0-9]/g, "");
                const foundKey = rowKeys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, "") === p);
                if (foundKey && row[foundKey] !== undefined) return row[foundKey];
            }
            return undefined;
        };

        const batchSize = 50;
        const total = allQuestions.length;
        let processed = 0;

        for (let i = 0; i < total; i += batchSize) {
            console.log(`Processing batch ${i / batchSize + 1}...`);
            const chunk = allQuestions.slice(i, i + batchSize);
            const batch = writeBatch(db);

            chunk.forEach((row, idx) => {
                try {
                    const docRef = doc(collection(db, "questions"));

                    // Parse Options
                    let options = [];
                    const valA = getValue(row, ['Option A', 'A', '(A)', 'a']);
                    const valB = getValue(row, ['Option B', 'B', '(B)', 'b']);
                    const valC = getValue(row, ['Option C', 'C', '(C)', 'c']);
                    const valD = getValue(row, ['Option D', 'D', '(D)', 'd']);

                    if (valA !== undefined && valA !== null) options.push(String(valA).trim());
                    if (valB !== undefined && valB !== null) options.push(String(valB).trim());
                    if (valC !== undefined && valC !== null) options.push(String(valC).trim());
                    if (valD !== undefined && valD !== null) options.push(String(valD).trim());

                    // Fallback for missing options (avoid crash, but log maybe)
                    if (options.length === 0) options = ['A', 'B', 'C', 'D'];

                    // Parse Correct Answer
                    let correctAns = 0;
                    const rawCorrect = getValue(row, ['Correct Answer', 'Answer', 'Ans', 'Correct']);
                    if (rawCorrect !== undefined && rawCorrect !== null) {
                        const val = String(rawCorrect).trim();
                        const valLower = val.toLowerCase();

                        if (['a', 'option a', '1', '(a)'].some(s => valLower === s || valLower.startsWith(s + ')'))) correctAns = 0;
                        else if (['b', 'option b', '2', '(b)'].some(s => valLower === s || valLower.startsWith(s + ')'))) correctAns = 1;
                        else if (['c', 'option c', '3', '(c)'].some(s => valLower === s || valLower.startsWith(s + ')'))) correctAns = 2;
                        else if (['d', 'option d', '4', '(d)'].some(s => valLower === s || valLower.startsWith(s + ')'))) correctAns = 3;
                        else {
                            const matchIndex = options.findIndex(opt => opt.toLowerCase().trim() === valLower);
                            if (matchIndex !== -1) {
                                correctAns = matchIndex;
                            }
                        }
                    }

                    // Subject Processing
                    let rawSubject = (getValue(row, ['Subject', 'Sub']) || 'Social Science').toLowerCase().trim();

                    if (rawSubject === 'sst') rawSubject = 'social science';
                    if (rawSubject.includes('social')) rawSubject = 'social science';

                    const isKnown = VALID_SUBJECTS.some(s => rawSubject.includes(s));
                    if (!isKnown) {
                        // console.warn(`Unknown Subject: ${rawSubject}. Defaulting to 'social science'.`);
                        rawSubject = 'social science';
                    }

                    const qData = {
                        question: getValue(row, ['Question', 'Q', 'text']) || '',
                        options: options,
                        correctAnswer: correctAns,
                        explanation: getValue(row, ['Explanation', 'Exp']) || '',
                        subject: rawSubject,
                        subSubject: '',
                        chapter: (getValue(row, ['Chapter', 'Chap']) || 'General').trim().replace(/\s+/g, ' '),
                        board: TARGET_BOARD,
                        class: TARGET_CLASS,
                        active: true,
                        createdAt: Date.now()
                    };

                    if (qData.question && qData.question.length > 1) {
                        batch.set(docRef, qData);
                    }
                } catch (rowError) {
                    console.error(`Error processing row ${i + idx}:`, rowError);
                }
            });

            console.log(`Committing batch ${i / batchSize + 1} with ${chunk.length} items...`);
            await batch.commit();
            console.log(`Batch ${i / batchSize + 1} committed.`);
            processed += chunk.length;
            console.log(`Uploaded ${processed}/${total} questions...`);
        }

        console.log("Updating Metadata...");
        await updateMetadata();
        console.log("Done!");
        process.exit(0);
    } catch (err) {
        console.error("FATAL ERROR:", err);
        process.exit(1);
    }
}

// Reuse updateMetadata function from previous scripts (condensed here for brevity or imported)
async function updateMetadata() {
    const querySnapshot = await getDocs(collection(db, "questions"));
    // ... (Metadata logic same as before, ensuring it rebuilds fully)
    // For safety, I'll copy the logic fully to ensure it works standalone.
    // (Omitting full copy here for brevity in this thought, but will write full file)
    const TaxonomyMap = {};
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const sub = data.subject ? data.subject.toLowerCase() : 'other';
        const chap = data.chapter ? data.chapter : 'General';
        const board = data.board || 'other';
        const cls = data.class || 'other';
        const key = `${board}_${cls}`;

        if (!TaxonomyMap[key]) {
            TaxonomyMap[key] = { subjects: new Set(), chapters: {} };
        }
        TaxonomyMap[key].subjects.add(sub);
        if (!TaxonomyMap[key].chapters[sub]) {
            TaxonomyMap[key].chapters[sub] = new Map();
        }
        const currentCount = TaxonomyMap[key].chapters[sub].get(chap) || 0;
        TaxonomyMap[key].chapters[sub].set(chap, currentCount + 1);
    });

    const finalTaxonomy = {};
    Object.keys(TaxonomyMap).forEach(key => {
        const validSubjects = Array.from(TaxonomyMap[key].subjects)
            .filter(s => !/^(option|otpion)/i.test(s) && s.length > 1)
            .sort();

        if (validSubjects.length > 0) {
            finalTaxonomy[key] = {
                subjects: validSubjects,
                chapters: validSubjects.reduce((acc, sub) => {
                    if (TaxonomyMap[key].chapters[sub]) {
                        const chapMap = TaxonomyMap[key].chapters[sub];
                        acc[sub] = Array.from(chapMap.keys())
                            .sort()
                            .map(name => ({ name, count: chapMap.get(name) || 0 }));
                    }
                    return acc;
                }, {})
            };
        }
    });

    await setDoc(doc(db, "metadata", "taxonomy"), {
        ...finalTaxonomy,
        lastUpdated: Date.now()
    });
}

main();
