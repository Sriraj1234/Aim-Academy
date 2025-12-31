const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/Class 10 SST BSEB.xlsx');
const OUTPUT_PATH = path.join(__dirname, 'sst_data.json');

const TARGET_BOARD = 'bseb';
const TARGET_CLASS = '10';
const VALID_SUBJECTS = ['hindi', 'english', 'math', 'mathematics', 'science', 'social science', 'sst', 'sanskrit', 'urdu', 'physics', 'chemistry', 'biology', 'history', 'geography', 'civics', 'economics', 'polity', 'political science'];

console.log(`Starting export for ${FILE_PATH}...`);

if (!fs.existsSync(FILE_PATH)) {
    console.error("File not found!");
    process.exit(1);
}

const workbook = XLSX.readFile(FILE_PATH);
let allQuestions = [];

workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet);
    console.log(`Sheet "${sheetName}": ${json.length} rows.`);
    allQuestions = [...allQuestions, ...json];
});

// Helper to find value
const getValue = (row, patterns) => {
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

const finalQuestions = [];

allQuestions.forEach((row, idx) => {
    try {
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

        // Fallback for missing options
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
            rawSubject = 'social science';
        }

        // Helper for Firestore Proto Format
        const toFsString = (str) => ({ stringValue: String(str) });
        const toFsInt = (num) => ({ integerValue: String(num) }); // API expects string for int64
        const toFsBool = (bool) => ({ booleanValue: bool });
        const toFsArray = (arr) => ({ arrayValue: { values: arr.map(toFsString) } });

        const qData = {
            fields: {
                question: toFsString(getValue(row, ['Question', 'Q', 'text']) || ''),
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

        if (qData.fields.question.stringValue.length > 1) {
            finalQuestions.push(qData);
        }
    } catch (rowError) {
        console.error(`Error processing row ${idx}:`, rowError);
    }
});

console.log(`Exporting ${finalQuestions.length} questions to JSON...`);
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalQuestions, null, 2));
console.log(`Done! Saved to ${OUTPUT_PATH}`);
