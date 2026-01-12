const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data/Class 12th BSEB Hindi Poetry.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[2]; // Sheet 3 (index 2)
const worksheet = workbook.Sheets[sheetName];
const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];

console.log(`Sheet: ${sheetName}`);
console.log(`Headers: ${JSON.stringify(headers)}`);

const rows = XLSX.utils.sheet_to_json(worksheet);
if (rows.length > 0) {
    console.log('First Row Keys:', Object.keys(rows[0]));
}
