const XLSX = require('xlsx');
const path = require('path');
const FILE_PATH = path.join(__dirname, '../data/Social science class 10 bseb.xlsx');
const workbook = XLSX.readFile(FILE_PATH);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet).slice(0, 5);
rows.forEach((r, i) => {
    console.log(`Row ${i}: Sub='${r.Subject}', Chap='${r.Chapter}'`);
});
