const XLSX = require('xlsx');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/Class 10 BAEB Math.xlsx');

try {
    console.log(`Reading: ${FILE_PATH}`);
    const workbook = XLSX.readFile(FILE_PATH);

    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);
        console.log(`\n--- Sheet: ${sheetName} ---`);
        console.log(`Row Count: ${rows.length}`);

        if (rows.length > 0) {
            console.log('Headers:', Object.keys(rows[0]).join(', '));
            console.log('Sample Row 1:', JSON.stringify(rows[0]));
        }
    });

} catch (e) {
    console.error("Error reading file:", e.message);
}
