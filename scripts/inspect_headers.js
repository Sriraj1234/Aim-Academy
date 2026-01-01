const XLSX = require('xlsx');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/Class 10 BAEB Math.xlsx');

const workbook = XLSX.readFile(FILE_PATH);

console.log("Sheets:", workbook.SheetNames.join(", "));

workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(sheet);
    console.log(`\nSHEET: ${name} (Rows: ${rows.length})`);
    if (rows.length > 0) {
        console.log("HEADERS:", Object.keys(rows[0]).join(" | "));
    }
});
