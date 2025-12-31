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

const FILE_PATH = path.join(__dirname, '../data/Class 10 Bseb Science .xlsx');
// TARGET TAGS - Inferred from filename
const TARGET_BOARD = 'bseb';
const TARGET_CLASS = '10';
const VALID_SUBJECTS = ['hindi', 'english', 'math', 'mathematics', 'science', 'social science', 'sst', 'sanskrit', 'urdu', 'physics', 'chemistry', 'biology', 'history', 'geography', 'civics', 'economics'];

async function main() {
    console.log(`Starting upload for ${FILE_PATH}...`);

    // 1. CLEAR DATABASE - DISABLED FOR APPEND
    console.log("Append Mode: Skipping database clear...");
    // To clear, set deleting = true. For append, set false.
    let deleting = false;
    while (deleting) {
        const q = query(collection(db, "questions"), limit(500));
        const snap = await getDocs(q);
        if (snap.size === 0) {
            deleting = false;
            break;
        }
        const batch = writeBatch(db);
        snap.forEach(d => batch.delete(d.ref));
        await batch.commit();
        console.log(`Deleted ${snap.size} old questions...`);
    }
    console.log("Database cleared.");

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
        const rowKeys = Object.keys(row);
        for (const pattern of patterns) {
            if (row[pattern] !== undefined) return row[pattern];
            // Fuzzy match
            const p = pattern.toLowerCase().replace(/[^a-z0-9]/g, "");
            const foundKey = rowKeys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, "") === p);
            if (foundKey && row[foundKey] !== undefined) return row[foundKey];
        }
        return undefined;
    };

    // PROCESS QUESTIONS
    const batchSize = 400;
    const total = allQuestions.length;
    let processed = 0;

    for (let i = 0; i < total; i += batchSize) {
        const chunk = allQuestions.slice(i, i + batchSize);
        const batch = writeBatch(db);

        chunk.forEach(row => {
            const docRef = doc(collection(db, "questions"));

            // Parse Options
            let options = [];
            const rawOptions = getValue(row, ['options', 'bikalp']);
            if (typeof rawOptions === 'string') {
                options = rawOptions.split(',').map(opt => opt.trim());
            } else {
                const valA = getValue(row, ['Option A', 'A', '(A)', 'a']);
                const valB = getValue(row, ['Option B', 'B', '(B)', 'b']);
                const valC = getValue(row, ['Option C', 'C', '(C)', 'c']);
                const valD = getValue(row, ['Option D', 'D', '(D)', 'd']);
                if (valA) options.push(valA.toString());
                if (valB) options.push(valB.toString());
                if (valC) options.push(valC.toString());
                if (valD) options.push(valD.toString());
            }

            // Parse Correct Answer (Advanced Logic)
            let correctAns = 0;
            const rawCorrect = getValue(row, ['Correct Answer', 'Answer', 'Ans', 'Correct']);
            if (rawCorrect !== undefined) {
                const val = rawCorrect.toString().trim();
                const valLower = val.toLowerCase();

                if (['a', 'option a', '1', '(a)'].some(s => valLower === s || valLower.startsWith(s + ')'))) correctAns = 0;
                else if (['b', 'option b', '2', '(b)'].some(s => valLower === s || valLower.startsWith(s + ')'))) correctAns = 1;
                else if (['c', 'option c', '3', '(c)'].some(s => valLower === s || valLower.startsWith(s + ')'))) correctAns = 2;
                else if (['d', 'option d', '4', '(d)'].some(s => valLower === s || valLower.startsWith(s + ')'))) correctAns = 3;
                else {
                    // Full text match
                    const matchIndex = options.findIndex(opt => opt.toLowerCase().trim() === valLower);
                    if (matchIndex !== -1) {
                        correctAns = matchIndex;
                    } else {
                        correctAns = (parseInt(val) || 1) - 1;
                        if (correctAns < 0 || correctAns > 3) correctAns = 0;
                    }
                }
            }

            // Sanitize Subject - STRICT MODE
            let rawSubject = (getValue(row, ['Subject', 'Sub']) || 'Hindi').toLowerCase().trim();
            const rawSubSubject = (getValue(row, ['Sub-subject', 'Sub Subject', 'Section', 'Part', 'Branch']) || '').trim();

            // SPLIT SCIENCE LOGIC
            if (rawSubject.includes('science') || rawSubject === 'sci') {
                const subLower = rawSubSubject.toLowerCase();
                if (subLower.includes('physics')) rawSubject = 'physics';
                else if (subLower.includes('chemistry')) rawSubject = 'chemistry';
                else if (subLower.includes('biology')) rawSubject = 'biology';
                // If sub-subject is missing, it will remain 'science' or fall back to Hindi logic below if needed.
                // But for now, let's assume we want to fix mapped sciences.
            }

            // 1. Check if it's a valid subject
            const isKnown = VALID_SUBJECTS.some(s => rawSubject.includes(s));
            // 2. Filter garbage (long strings, parens, etc)
            const isJunk = rawSubject.length > 20 || /[()]/.test(rawSubject) || /^(option|otpion)/i.test(rawSubject);

            if (!isKnown || isJunk) {
                // Default to Hindi for this file as requested
                rawSubject = 'hindi';
            }

            const qData = {
                question: getValue(row, ['Question', 'Q', 'Prashn', 'text']) || '',
                options: options.length > 0 ? options : ['A', 'B', 'C', 'D'],
                correctAnswer: correctAns,
                explanation: getValue(row, ['Explanation', 'Exp']) || '',
                subject: rawSubject,
                subSubject: rawSubSubject,
                // Clean Chapter name too
                chapter: (getValue(row, ['Chapter', 'Chap']) || 'General').trim().replace(/\s+/g, ' '),
                board: TARGET_BOARD,
                class: TARGET_CLASS,
                active: true,
                createdAt: Date.now()
            };

            // Validate minimum data
            if (qData.question && qData.question.length > 1) {
                batch.set(docRef, qData);
            }
        });

        await batch.commit();
        processed += chunk.length;
        console.log(`Uploaded ${processed}/${total} questions...`);
    }

    console.log("Updating Metadata...");
    await updateMetadata();
    console.log("Done!");
    process.exit(0);
}

async function updateMetadata() {
    const querySnapshot = await getDocs(collection(db, "questions"));
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
            .filter(s => {
                const isOption = /^(option|otpion)\s*[a-d0-9]$/i.test(s) || /^[a-d]$/i.test(s) || s.length < 2;
                return !isOption;
            })
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
