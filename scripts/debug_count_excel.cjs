const XLSX = require('xlsx');
const path = require('path');

const FILES = [
    'data/Class 12th BSEB Hindi Poetry.xlsx',
    'data/Class 12th BSEB Hindi Prose.xlsx'
];

FILES.forEach(relativePath => {
    const filePath = path.join(__dirname, '..', relativePath);
    try {
        console.log(`\nAnalyzing ${relativePath}...`);
        const workbook = XLSX.readFile(filePath);
        console.log(`Total Sheets: ${workbook.SheetNames.length}`);

        let totalRows = 0;
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet);
            console.log(`  - ${sheetName}: ${rows.length} rows`);
            totalRows += rows.length;
        });

        console.log(`Total Questions in File: ${totalRows}`);
    } catch (e) {
        console.error(`Error reading ${relativePath}:`, e.message);
    }
});
