const fs = require('fs');
const https = require('https');
const path = require('path');
const XLSX = require('xlsx');

// CONFIG
const PROJECT_ID = "aim-83922";
const COLLECTION = "questions";
const FILE_PATH = path.join(__dirname, '../data/Class 10 SST BSEB.xlsx');
const RULES_URL = `https://console.firebase.google.com/project/${PROJECT_ID}/firestore/rules`;

// 1. HELPERS
function postToFirestore(docData) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(docData);
        const options = {
            hostname: 'firestore.googleapis.com',
            path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Note: No Auth Header -> Relies on OPEN RULES
            }
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

function getValue(row, patterns) {
    if (!row || typeof row !== 'object') return undefined;
    const rowKeys = Object.keys(row);
    for (const pattern of patterns) {
        if (row[pattern] !== undefined) return row[pattern];
        const p = pattern.toLowerCase().replace(/[^a-z0-9]/g, "");
        const foundKey = rowKeys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, "") === p);
        if (foundKey && row[foundKey] !== undefined) return row[foundKey];
    }
    return undefined;
}

// 2. MAIN LOGIC
async function main() {
    console.log("==================================================");
    console.log("   SST CLASS 10 DATA UPLOADER (NO-SDK VERSION)    ");
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

    // Helper for Firestore Proto Format
    const toFsString = (str) => ({ stringValue: String(str) });
    const toFsInt = (num) => ({ integerValue: String(num) });
    const toFsBool = (bool) => ({ booleanValue: bool });
    const toFsArray = (arr) => ({ arrayValue: { values: arr.map(toFsString) } });

    console.log("Attempting test upload of 1st question...");

    // Process first item for test
    const firstRow = allQuestions[0];
    const testDoc = processRow(firstRow);

    if (!testDoc) {
        console.error("Could not process first row!");
        return;
    }

    try {
        await postToFirestore(testDoc);
        console.log("SUCCESS! Database is open and writable.");
    } catch (e) {
        if (e.status === 403 || e.status === 401) {
            console.error("\n❌ UPLOAD BLOCKED (Permission Denied)");
            console.error("You MUST temporarily open your Firestore Rules.");
            console.error(`Go here: ${RULES_URL}`);
            console.error("Change 'allow write: if isAdmin();' to 'allow write: if true;'");
            console.error("Then run this script again.");
            process.exit(1);
        } else {
            console.error("Upload Error:", e);
            process.exit(1);
        }
    }

    console.log("Starting full upload in batches of 10...");

    let count = 0;
    let errors = 0;
    const BATCH_SIZE = 10;

    for (let i = 0; i < allQuestions.length; i += BATCH_SIZE) {
        const batch = allQuestions.slice(i, i + BATCH_SIZE);
        const promises = batch.map(row => {
            const doc = processRow(row);
            if (!doc) return Promise.resolve();
            return postToFirestore(doc).catch(e => {
                errors++;
                // console.error("Item Error:", e.status); 
            });
        });

        await Promise.all(promises);
        count += batch.length;
        process.stdout.write(`\rProgress: ${count} / ${allQuestions.length} (Errors: ${errors})`);
    }

    console.log("\n\nDONE! check your database.");
}

function processRow(row) {
    try {
        // Debug first row structure
        if (!global.hasLogged) {
            console.log("DEBUG: First Row Keys:", Object.keys(row));
            //   console.log("DEBUG: First Row Data:", JSON.stringify(row));
            global.hasLogged = true;
        }

        const TARGET_BOARD = 'bseb';
        const TARGET_CLASS = '10';

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

        let correctAns = 0;
        const rawCorrect = getValue(row, ['Correct Answer', 'Answer', 'Ans', 'Correct']);
        if (rawCorrect) {
            const val = String(rawCorrect).trim().toLowerCase();
            if (['a', 'option a', '1', '(a)'].some(s => val === s)) correctAns = 0;
            else if (['b', 'option b', '2', '(b)'].some(s => val === s)) correctAns = 1;
            else if (['c', 'option c', '3', '(c)'].some(s => val === s)) correctAns = 2;
            else if (['d', 'option d', '4', '(d)'].some(s => val === s)) correctAns = 3;
        }

        let rawSubject = (getValue(row, ['Subject', 'Sub']) || 'Social Science').toLowerCase().trim();
        if (rawSubject === 'sst' || rawSubject.includes('social')) rawSubject = 'social science';

        // Helper for Firestore Proto Format - Redefining inside scope for simplicity in this file
        const toFsString = (str) => ({ stringValue: String(str) });
        const toFsInt = (num) => ({ integerValue: String(num) });
        const toFsBool = (bool) => ({ booleanValue: bool });
        const toFsArray = (arr) => ({ arrayValue: { values: arr.map(toFsString) } });

        const qText = getValue(row, ['Question', 'Q', 'text']);
        if (!qText) return null; // REQUIRED

        return {
            fields: {
                question: toFsString(qText),
                options: toFsArray(options),
                correctAnswer: toFsInt(correctAns),
                explanation: toFsString(getValue(row, ['Explanation', 'Exp']) || ''),
                subject: toFsString(rawSubject),
                subSubject: toFsString(''),
                chapter: toFsString((getValue(row, ['Chapter', 'Chap']) || 'General').trim().replace(/\s+/g, ' ')),
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
