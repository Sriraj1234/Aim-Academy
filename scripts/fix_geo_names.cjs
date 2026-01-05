const fs = require('fs');
const https = require('https');
const path = require('path');
const XLSX = require('xlsx');

// CONFIG
const PROJECT_ID = "aim-83922";
const COLLECTION = "questions";
const FILE_PATH = path.join(__dirname, '../data/Social Science class10 bseb fixed.xlsx');
const DATABASE_PATH = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Helper: Extract value with fuzzy matching
function getValue(row, patterns) {
    if (!row || typeof row !== 'object') return undefined;
    const rowKeys = Object.keys(row);

    for (const pattern of patterns) {
        if (row[pattern] !== undefined) return row[pattern];
        const p = pattern.toLowerCase().replace(/[^a-z0-9]/g, "");
        const foundKey = rowKeys.find(k => {
            const normalized = k.toLowerCase().replace(/[^a-z0-9]/g, "");
            return normalized === p || normalized.includes(p) || p.includes(normalized);
        });
        if (foundKey && row[foundKey] !== undefined) return row[foundKey];
    }
    return undefined;
}

// 1. Read Excel and Build Map
function loadExcelData() {
    console.log(`Reading file: ${FILE_PATH}`);
    if (!fs.existsSync(FILE_PATH)) {
        throw new Error("Excel file not found!");
    }

    const workbook = XLSX.readFile(FILE_PATH);
    const questionMap = new Map(); // questionText -> correctChapter
    let geoCount = 0;

    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        rows.forEach(row => {
            // Check Subject
            const sub = getValue(row, ['Subject', 'Sub']);
            if ((sub || '').trim().toLowerCase() !== 'geography') return;

            // Get Question Text
            const qTeXt = getValue(row, ['Question', 'Q', 'text']);
            if (!qTeXt) return;

            // Get Correct Chapter
            const chapter = getValue(row, [
                'Chapter', 'Chap', 'Chapter name in hindi', 'Chapter Name in Hindi',
                'Chapter Name (Hindi)', 'chapter'
            ]);

            if (chapter) {
                // Normalize key: remove spaces, lowercase
                const key = String(qTeXt).trim();
                questionMap.set(key, String(chapter).trim());
                geoCount++;
            }
        });
    });

    console.log(`Loaded ${geoCount} Geography questions from Excel.`);
    return questionMap;
}

// 2. Fetch Firestore Data
function fetchFirestoreInfo() {
    return new Promise((resolve, reject) => {
        const query = {
            structuredQuery: {
                from: [{ collectionId: COLLECTION }],
                where: {
                    fieldFilter: {
                        field: { fieldPath: 'subject' },
                        op: 'EQUAL',
                        value: { stringValue: 'geography' }
                    }
                },
                limit: 2000 // Ensure we get all
            }
        };

        const options = {
            hostname: 'firestore.googleapis.com',
            path: `${DATABASE_PATH}:runQuery`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const results = JSON.parse(data);
                    const docs = results.filter(r => r.document).map(r => r.document);
                    resolve(docs);
                } else {
                    reject(new Error(`Firestore Error: ${res.statusCode} ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.write(JSON.stringify(query));
        req.end();
    });
}

// 3. Update Document
function updateDocument(name, newChapter) {
    return new Promise((resolve, reject) => {
        // name is like "projects/aim-83922/databases/(default)/documents/questions/DOC_ID"
        // extract the relative path for the API
        const docPath = name.split('/documents/')[1];

        const body = JSON.stringify({
            fields: {
                chapter: { stringValue: newChapter }
            }
        });

        const options = {
            hostname: 'firestore.googleapis.com',
            path: `${DATABASE_PATH}/${docPath}?updateMask.fieldPaths=chapter`,
            method: 'PATCH', // Use PATCH for partial update with mask
            headers: { 'Content-Type': 'application/json' }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve();
                } else {
                    reject(new Error(`Update Failed: ${res.statusCode} ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// MAIN
async function main() {
    try {
        const excelMap = loadExcelData();
        console.log("Fetching Firestore data...");
        const docs = await fetchFirestoreInfo();
        console.log(`Found ${docs.length} questions in DB.`);

        let updatedCount = 0;
        let skippedCount = 0;
        let notFoundInExcel = 0;

        // Process sequentially to avoid rate limits
        for (const doc of docs) {
            const qText = doc.fields.question?.stringValue;
            const currentChap = doc.fields.chapter?.stringValue;
            const docName = doc.name;

            if (!qText) continue;

            // Lookup in Excel Map
            const correctChap = excelMap.get(qText.trim());

            if (correctChap) {
                if (currentChap !== correctChap) {
                    process.stdout.write(`Fixing: ${qText.substring(0, 20)}... | ${currentChap} -> ${correctChap}\n`);
                    await updateDocument(docName, correctChap);
                    updatedCount++;
                } else {
                    skippedCount++;
                }
            } else {
                notFoundInExcel++;
                // Try fuzzy lookup if exact match fails?
                // keeping it safe for now: exact match only
            }
        }

        console.log("\n=== SUMMARY ===");
        console.log(`Total DB Records: ${docs.length}`);
        console.log(`Updated: ${updatedCount}`);
        console.log(`Skipped (Already Correct): ${skippedCount}`);
        console.log(`Not Found in Excel: ${notFoundInExcel}`);

    } catch (e) {
        console.error("FATAL ERROR:", e);
    }
}

main();
