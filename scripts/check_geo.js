const XLSX = require('xlsx');
const path = require('path');
const FILE_PATH = path.join(__dirname, '../data/Social science class 10 bseb.xlsx');
const workbook = XLSX.readFile(FILE_PATH);

// Find Geography rows and check their chapter values
workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const geoRows = rows.filter(r => (r.Subject || '').toLowerCase() === 'geography');
    if (geoRows.length > 0) {
        console.log(`\n=== Sheet: ${sheetName} ===`);
        console.log(`Geography Rows: ${geoRows.length}`);

        // Get unique chapters
        const uniqueChaps = new Set(geoRows.map(r => r.Chapter || 'EMPTY'));
        console.log("Unique Chapters:", Array.from(uniqueChaps));
    }
});

console.log("\n--- Check Column Names in First Sheet ---");
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);
if (rows.length > 0) {
    console.log("All Keys:", Object.keys(rows[0]));
}
