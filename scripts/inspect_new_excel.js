
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../data/Social Science class10 bseb fixed.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert first row to JSON to check headers
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log("File:", filePath);
    console.log("Sheet:", sheetName);
    console.log("Headers:", data[0]);
    console.log("First Row Data:", data[1]);

} catch (error) {
    console.error("Error reading file:", error);
}
