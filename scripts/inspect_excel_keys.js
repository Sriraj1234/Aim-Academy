const XLSX = require('xlsx');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/Social science class 10 bseb.xlsx');
const workbook = XLSX.readFile(FILE_PATH);

workbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- SHEET: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);
    if (rows.length > 0) {
        console.log("Keys:", Object.keys(rows[0]));
        console.log("Sample Subject Val:", rows[0]['Subject']);
        console.log("Sample Chapter Val:", rows[0]['Chapter']);
    } else {
        console.log("(Empty Sheet)");
    }
});
