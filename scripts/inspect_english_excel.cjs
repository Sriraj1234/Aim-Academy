const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const files = [
    'Class 12th BSEB english Prose (1).xlsx',
    'Class 12th BSEB english Poetry.xlsx'
];

const dataDir = path.join(__dirname, '../data');

files.forEach(file => {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`\n--- Inspecting ${file} ---`);
        const workbook = XLSX.readFile(filePath);
        console.log('Sheet Names:', workbook.SheetNames);

        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            if (data.length > 0) {
                console.log(`First row of sheet '${sheetName}':`, data[0]);
            } else {
                console.log(`Sheet '${sheetName}' is empty.`);
            }
        });
    } else {
        console.log(`File not found: ${filePath}`);
    }
});
