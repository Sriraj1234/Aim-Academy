const XLSX = require('xlsx');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/Social science class 10 bseb.xlsx');

const workbook = XLSX.readFile(FILE_PATH);
const subjects = new Set();
const chapters = new Set();

workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);
    rows.forEach(row => {
        // Try to find Subject column
        const sub = row['Subject'] || row['subject'] || row['Sub'] || row['sub'];
        if (sub) subjects.add(String(sub).trim());

        // Also check Chapter just in case
        const chap = row['Chapter'] || row['chapter'];
        if (chap) chapters.add(String(chap).trim());
    });
});

console.log("Unique SUBJECTS in Excel:");
subjects.forEach(s => console.log(`- ${s}`));

console.log("\nUnique CHAPTERS (First 10):");
Array.from(chapters).slice(0, 10).forEach(c => console.log(`- ${c}`));
