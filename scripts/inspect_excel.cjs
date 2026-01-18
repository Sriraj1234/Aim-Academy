const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../data/Class 12th BSEB Chemistry questions (1).xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    console.log('Sheet Names:', workbook.SheetNames);

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length > 0) {
        console.log('First Sheet Headers:', jsonData[0]);
        console.log('First Row Data:', jsonData[1]);
    } else {
        console.log('First sheet is empty.');
    }

    // Check a random other sheet
    if (workbook.SheetNames.length > 1) {
        const secondSheetName = workbook.SheetNames[1];
        const worksheet2 = workbook.Sheets[secondSheetName];
        const jsonData2 = XLSX.utils.sheet_to_json(worksheet2, { header: 1 });
        console.log('Second Sheet Headers:', jsonData2[0]);
    }

} catch (error) {
    console.error('Error reading file:', error);
}
