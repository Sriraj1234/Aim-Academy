const XLSX = require('xlsx');
const path = require('path');
const FILE_PATH = path.join(__dirname, '../data/Social science class 10 bseb.xlsx');
const workbook = XLSX.readFile(FILE_PATH);
const sheet = workbook.Sheets[workbook.SheetNames[0]]; // Just 1st sheet
const rows = XLSX.utils.sheet_to_json(sheet);
console.log("KEYS:", Object.keys(rows[0]));
