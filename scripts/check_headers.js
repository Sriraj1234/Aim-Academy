const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const FILE_PATH = path.join(__dirname, '../data/Social science class 10 bseb.xlsx');
const workbook = XLSX.readFile(FILE_PATH);

let output = [];

// Check headers of each sheet
workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) return;

    output.push(`\n=== Sheet: ${sheetName} ===`);
    output.push(`Headers: ${Object.keys(rows[0]).join(' | ')}`);

    // Show first row values
    const first = rows[0];
    Object.keys(first).forEach(k => {
        output.push(`  ${k}: "${first[k]}"`);
    });
});

fs.writeFileSync('headers_check.txt', output.join('\n'), 'utf8');
console.log("Saved to headers_check.txt");
