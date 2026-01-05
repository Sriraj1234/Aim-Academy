const XLSX = require('xlsx');
const path = require('path');
const FILE_PATH = path.join(__dirname, '../data/Social Science class10 bseb fixed.xlsx');

console.log(`Reading file: ${FILE_PATH}`);
const workbook = XLSX.readFile(FILE_PATH);

const subjects = new Map();
let totalRows = 0;

workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);
    totalRows += rows.length;

    // Normalize keys to find Subject
    const getVal = (r, key) => {
        const k = Object.keys(r).find(x => x.toLowerCase() === key.toLowerCase());
        return k ? r[k] : undefined;
    };

    rows.forEach(r => {
        const s = getVal(r, 'Subject');
        if (s) {
            const key = s.trim();
            subjects.set(key, (subjects.get(key) || 0) + 1);
        }
    });
});

console.log(`Total Rows: ${totalRows}`);
const sortedSubjects = Array.from(subjects.entries()).sort((a, b) => b[1] - a[1]);
console.log("Subjects:", sortedSubjects);

const fs = require('fs');
fs.writeFileSync('excel_subjects.json', JSON.stringify(sortedSubjects, null, 2));
