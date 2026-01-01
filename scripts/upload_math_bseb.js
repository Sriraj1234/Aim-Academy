const fs = require('fs');
const https = require('https');
const path = require('path');
const XLSX = require('xlsx');

// CONFIG
const PROJECT_ID = "aim-83922";
const COLLECTION = "questions";
const FILE_PATH = path.join(__dirname, '../data/Class 10 BAEB Math.xlsx'); // Specific file for Math

// 1. HELPERS
function postToFirestore(docData) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(docData);
        const options = {
            hostname: 'firestore.googleapis.com',
            path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject({ status: res.statusCode, body: data });
                }
            });
        });
        req.on('error', (e) => reject(e));
        req.write(body);
        req.end();
    });
}

// IMPROVED getValue - handles multiple header patterns including Hindi variants
function getValue(row, patterns) {
    if (!row || typeof row !== 'object') return undefined;
    const rowKeys = Object.keys(row);

    for (const pattern of patterns) {
        // Exact match first
        if (row[pattern] !== undefined) return row[pattern];

        // Fuzzy match - normalize both sides
        const p = pattern.toLowerCase().replace(/[^a-z0-9]/g, "");
        const foundKey = rowKeys.find(k => {
            const normalized = k.toLowerCase().replace(/[^a-z0-9]/g, "");
            return normalized === p || normalized.includes(p) || p.includes(normalized);
        });
        if (foundKey && row[foundKey] !== undefined) return row[foundKey];
    }
    return undefined;
}

// Parse correct answer from various formats
function parseCorrectAnswer(rawCorrect, options) {
    if (!rawCorrect) return 0;

    const val = String(rawCorrect).trim().toLowerCase();

    // Check for option letter patterns
    if (['a', 'option a', '(a)', 'optiona', 'opt a'].some(s => val === s || val.startsWith(s))) return 0;
    if (['b', 'option b', '(b)', 'optionb', 'opt b'].some(s => val === s || val.startsWith(s))) return 1;
    if (['c', 'option c', '(c)', 'optionc', 'opt c'].some(s => val === s || val.startsWith(s))) return 2;
    if (['d', 'option d', '(d)', 'optiond', 'opt d'].some(s => val === s || val.startsWith(s))) return 3;

    // Check if answer text matches one of the options
    const originalVal = String(rawCorrect).trim();
    for (let i = 0; i < options.length; i++) {
        // Direct string match (tolerant of slight whitespace/case diffs)
        if (options[i].toLowerCase().trim() === val || options[i].trim() === originalVal) {
            return i;
        }
    }

    return 0; // default
}

// 2. MAIN LOGIC
async function main() {
    console.log("==================================================");
    console.log("   MATH CLASS 10 DATA UPLOADER (BSEB)       ");
    console.log("==================================================");
    console.log(`Reading file: ${FILE_PATH}`);

    if (!fs.existsSync(FILE_PATH)) {
        console.error("ERROR: File not found!");
        return;
    }

    const workbook = XLSX.readFile(FILE_PATH);
    let allQuestions = [];
    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);
        allQuestions = [...allQuestions, ...rows];
    });

    console.log(`Total Rows Parsed: ${allQuestions.length}`);

    if (allQuestions.length === 0) {
        console.warn("No rows found in the Excel file.");
        return;
    }

    // Test first
    console.log("\nTesting with first row...");
    const testDoc = processRow(allQuestions[0]);
    if (!testDoc) {
        console.error("Failed to process first row!");
        return;
    }

    try {
        await postToFirestore(testDoc);
        console.log("SUCCESS! Database is writable.");
    } catch (e) {
        console.error("Upload blocked:", e.status || e);
        return;
    }

    console.log("\nStarting full upload...");
    let count = 0, errors = 0;
    const BATCH_SIZE = 10;

    for (let i = 0; i < allQuestions.length; i += BATCH_SIZE) {
        const batch = allQuestions.slice(i, i + BATCH_SIZE);
        const promises = batch.map(row => {
            const doc = processRow(row);
            if (!doc) return Promise.resolve();
            return postToFirestore(doc).catch(() => { errors++; });
        });

        await Promise.all(promises);
        count += batch.length;
        process.stdout.write(`\rProgress: ${count} / ${allQuestions.length} (Errors: ${errors})`);
    }

    console.log("\n\nDONE! Questions uploaded.");
}

function processRow(row) {
    try {
        const TARGET_BOARD = 'bseb';
        const TARGET_CLASS = '10';
        const TARGET_SUBJECT = 'math'; // Explicitly Math

        // Get options
        let options = [];
        const valA = getValue(row, ['Option A', 'A', '(A)', 'a']);
        const valB = getValue(row, ['Option B', 'B', '(B)', 'b']);
        const valC = getValue(row, ['Option C', 'C', '(C)', 'c']);
        const valD = getValue(row, ['Option D', 'D', '(D)', 'd']);

        if (valA) options.push(String(valA).trim());
        if (valB) options.push(String(valB).trim());
        if (valC) options.push(String(valC).trim());
        if (valD) options.push(String(valD).trim());
        if (options.length === 0) options = ['A', 'B', 'C', 'D'];

        // Parse correct answer
        const rawCorrect = getValue(row, ['Correct Answer', 'Answer', 'Ans', 'Correct']);
        const correctAns = parseCorrectAnswer(rawCorrect, options);

        // Get subject - Override with Math if missing or generic, but allow row to specify specific sub-topics if needed
        // For now, force 'math' as main subject

        // Get chapter - Flexible matching
        let chapter = getValue(row, [
            'Chapter', 'Chap', 'Chapter Name', 'Topic'
        ]);
        chapter = (chapter || 'General').trim();

        const toFsString = (str) => ({ stringValue: String(str) });
        const toFsInt = (num) => ({ integerValue: String(num) });
        const toFsBool = (bool) => ({ booleanValue: bool });
        const toFsArray = (arr) => ({ arrayValue: { values: arr.map(toFsString) } });

        const qText = getValue(row, ['Question', 'Q', 'text', 'Question Text']);
        if (!qText) return null;

        return {
            fields: {
                question: toFsString(qText),
                options: toFsArray(options),
                correctAnswer: toFsInt(correctAns),
                explanation: toFsString(getValue(row, ['Explanation', 'Exp']) || ''),
                subject: toFsString(TARGET_SUBJECT),
                subSubject: toFsString(''),
                chapter: toFsString(chapter),
                board: toFsString(TARGET_BOARD),
                class: toFsString(TARGET_CLASS),
                active: toFsBool(true),
                createdAt: toFsInt(Date.now())
            }
        };
    } catch (e) {
        console.error("Process Error:", e);
        return null;
    }
}

main();
