const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const FILE_PATH = path.join(__dirname, '../data/Social science class 10 bseb.xlsx');
const workbook = XLSX.readFile(FILE_PATH);

let output = [];

// Check ALL sheets and their subject/chapter breakdown
workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) return;

    output.push(`\n=== Sheet: ${sheetName} (${rows.length} rows) ===`);

    // Group by Subject
    const bySubject = {};
    rows.forEach(r => {
        const sub = (r.Subject || 'NO_SUBJECT').trim();
        const chap = (r.Chapter || 'NO_CHAPTER').trim();
        if (!bySubject[sub]) bySubject[sub] = {};
        if (!bySubject[sub][chap]) bySubject[sub][chap] = 0;
        bySubject[sub][chap]++;
    });

    Object.keys(bySubject).forEach(sub => {
        output.push(`  ${sub}:`);
        Object.keys(bySubject[sub]).forEach(chap => {
            output.push(`    - ${chap}: ${bySubject[sub][chap]} Qs`);
        });
    });
});

fs.writeFileSync('excel_analysis.txt', output.join('\n'), 'utf8');
console.log("Analysis saved to excel_analysis.txt");
