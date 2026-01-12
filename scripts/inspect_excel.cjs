const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const dataDir = path.join(__dirname, '../data');

if (!fs.existsSync(dataDir)) {
    console.log('Data directory not found:', dataDir);
    process.exit(1);
}

const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.xlsx'));

files.forEach(file => {
    try {
        const fullPath = path.join(dataDir, file);
        const workbook = XLSX.readFile(fullPath);
        console.log(`\nFile: ${file}`);
        console.log(`Sheets: ${workbook.SheetNames.join(', ')}`);

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
        console.log(`Headers (Sheet 1): ${headers ? headers.join(', ') : 'Empty'}`);
    } catch (err) {
        console.error(`Error reading ${file}:`, err.message);
    }
});
