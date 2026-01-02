const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, writeBatch, getDoc, setDoc } = require('firebase/firestore');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Configuration
const EXCEL_FILE_PATH = path.join(__dirname, '../data/Class 10 bseb Math.xlsx');
const GLOBAL_SETTINGS = {
    class: '10',
    board: 'bseb',
    stream: 'science' // Math usually falls under science stream context in this app
};

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

// Check if config is loaded
if (!firebaseConfig.apiKey) {
    console.error('Error: Firebase credentials not found in .env.local');
    process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ID Generator
function generateQuestionId(questionText, board, cls, subject) {
    const q = questionText.trim().toLowerCase().replace(/\s+/g, ' ');
    const b = board.trim().toLowerCase();
    const c = cls.trim().toLowerCase();
    const s = subject.trim().toLowerCase();
    const str = `${b}-${c}-${s}-${q}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    const hashStr = (hash >>> 0).toString(16);
    return `${b}_${c}_${s}_${hashStr}`;
}

// Helpers
function normalizeKey(k) {
    return k.toLowerCase().trim();
}

function findOptionKey(keys, letter) {
    const normalize = normalizeKey;
    const candidates = [`option ${letter}`, `opt ${letter}`, `(${letter})`, `${letter})`];
    let key = keys.find(k => candidates.includes(normalize(k)));
    if (!key) {
        key = keys.find(k => normalize(k).includes('option') && normalize(k).includes(letter));
    }
    if (!key) {
        key = keys.find(k => normalize(k) === letter);
    }
    return key;
}

// Parsing Logic
function parseRow(row, sheetName, index) {
    const keys = Object.keys(row);
    const normalize = normalizeKey;

    // Subject
    const explicitSubjectKeys = ['subject', 'sub', 'subject name', 'subjects', 'subject_name', 'course'];
    let subjectKey = keys.find(k => explicitSubjectKeys.includes(normalize(k)));
    if (!subjectKey) {
        subjectKey = keys.find(k => {
            const norm = normalize(k);
            return (norm.includes('subject') && !norm.includes('main')) || norm === 'sub';
        });
    }
    const subjectRaw = subjectKey ? row[subjectKey] : 'mathematics';
    const subject = String(subjectRaw).toLowerCase();

    // Chapter
    const chapterKey = keys.find(k =>
        ['chapter', 'topic', 'unit', 'lesson', 'chap'].some(keyword => normalize(k).includes(keyword))
    );
    const chapter = chapterKey ? String(row[chapterKey]) : sheetName;

    // Question
    const questionCandidates = ['question', 'question text', 'q', 'questions', 'qs', 'problem'];
    let questionKey = keys.find(k => questionCandidates.includes(normalize(k)));
    if (!questionKey) {
        questionKey = keys.find(k => normalize(k).includes('question'));
    }
    const question = questionKey ? String(row[questionKey]) : '';

    // Options
    const options = [
        findOptionKey(keys, 'a') ? String(row[findOptionKey(keys, 'a')] || '') : '',
        findOptionKey(keys, 'b') ? String(row[findOptionKey(keys, 'b')] || '') : '',
        findOptionKey(keys, 'c') ? String(row[findOptionKey(keys, 'c')] || '') : '',
        findOptionKey(keys, 'd') ? String(row[findOptionKey(keys, 'd')] || '') : ''
    ];

    // Answer
    let correctAnswer = 0;
    const ansCandidates = ['correct answer', 'correct', 'answer', 'ans', 'correct_option'];
    let ansKey = keys.find(k => ansCandidates.includes(normalize(k)));
    if (!ansKey) {
        ansKey = keys.find(k => normalize(k).includes('answer') || normalize(k).includes('correct'));
    }
    const rawAns = (ansKey ? row[ansKey] : '').toString().trim().toLowerCase();

    if (rawAns === 'a' || rawAns === 'option a') correctAnswer = 0;
    else if (rawAns === 'b' || rawAns === 'option b') correctAnswer = 1;
    else if (rawAns === 'c' || rawAns === 'option c') correctAnswer = 2;
    else if (rawAns === 'd' || rawAns === 'option d') correctAnswer = 3;
    else {
        const idx = options.findIndex(opt => opt && opt.trim().toLowerCase() === rawAns);
        if (idx !== -1) correctAnswer = idx;
    }

    // Main Subject
    const mainSubjectKey = keys.find(k => ['main subject', 'main_subject', 'mainsubject'].includes(normalize(k)));
    const mainSubject = mainSubjectKey ? String(row[mainSubjectKey]) : null;

    return {
        question,
        options,
        correctAnswer,
        subject,
        chapter,
        board: GLOBAL_SETTINGS.board,
        class: GLOBAL_SETTINGS.class,
        stream: GLOBAL_SETTINGS.stream,
        mainSubject,
        isValid: !!(question && options[0] && options[1])
    };
}

async function main() {
    console.log('=== Math Upload Script ===');
    console.log(`File: ${EXCEL_FILE_PATH}`);

    if (!fs.existsSync(EXCEL_FILE_PATH)) {
        console.error('File not found!');
        process.exit(1);
    }

    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const allQuestions = [];

    // Flatten all sheets
    workbook.SheetNames.forEach(sheetName => {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        rows.forEach((row, idx) => {
            const q = parseRow(row, sheetName, idx);
            if (q.isValid) allQuestions.push(q);
        });
    });

    console.log(`Parsed ${allQuestions.length} valid questions.`);

    // Batched Upload
    const BATCH_SIZE = 450;
    let globalCounter = 0;
    let metaModified = false;
    let metaData = {}; // We will fetch real metadata first

    // Fetch Metadata
    console.log('Fetching taxonomy metadata...');
    const metaRef = doc(db, 'metadata', 'taxonomy');
    const metaSnap = await getDoc(metaRef);
    if (metaSnap.exists()) {
        metaData = metaSnap.data();
    }

    for (let i = 0; i < allQuestions.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = allQuestions.slice(i, i + BATCH_SIZE);

        console.log(`Processing batch ${i / BATCH_SIZE + 1}...`);

        chunk.forEach(q => {
            globalCounter++;
            const uniqueSuffix = `${Date.now().toString(36)}${globalCounter.toString().padStart(6, '0')}`;
            const baseId = generateQuestionId(q.question, q.board, q.class, q.subject);
            const docId = `${baseId}_${uniqueSuffix}`;

            const ref = doc(db, 'questions', docId);
            batch.set(ref, {
                ...q,
                createdAt: Date.now(),
                active: true
            });

            // Metadata update logic
            const key = `${q.board.toLowerCase()}_${q.class}`;
            const subj = q.subject.toLowerCase();

            if (!metaData[key]) metaData[key] = { subjects: [], chapters: {} };
            if (!metaData[key].subjects.includes(subj)) {
                metaData[key].subjects.push(subj);
                metaModified = true;
            }
            if (!metaData[key].chapters) metaData[key].chapters = {};
            if (!metaData[key].chapters[subj]) metaData[key].chapters[subj] = [];

            const existing = metaData[key].chapters[subj].map(c => typeof c === 'string' ? c : c.name);
            if (!existing.includes(q.chapter)) {
                metaData[key].chapters[subj].push({ name: q.chapter, count: 1 });
                metaModified = true;
            }
        });

        await batch.commit();
        console.log(`Batch ${i / BATCH_SIZE + 1} committed.`);
    }

    // Save Metadata
    if (metaModified) {
        console.log('Updating metadata...');
        await setDoc(metaRef, metaData);
    }

    console.log('UPLOAD COMPLETE! 🚀');
    process.exit(0);
}

main().catch(error => {
    console.error('Fatal Error:', error);
    process.exit(1);
});
