const XLSX = require('xlsx');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/Class 10 SST BSEB.xlsx');

if (!require('fs').existsSync(FILE_PATH)) {
    console.error(`File not found: ${FILE_PATH}`);
    process.exit(1);
}

const workbook = XLSX.readFile(FILE_PATH);
workbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet);
    if (json.length > 0) {
        console.log('Columns:');
        Object.keys(json[0]).forEach(key => console.log(` - "${key}"`));
        console.log('\nSample Row 1:');
        console.log(JSON.stringify(json[0], null, 2));
    } else {
        console.log('(Empty Sheet)');
    }
});
