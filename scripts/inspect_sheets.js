
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../data/Social Science class10 bseb fixed.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    console.log("File:", filePath);
    console.log("Total Sheets:", workbook.SheetNames.length);

    workbook.SheetNames.forEach((name, index) => {
        const sheet = workbook.Sheets[name];
        // Approximate row count using decoding range
        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
        const count = range.e.r + 1;
        console.log(`Sheet ${index + 1}: "${name}" - Approx Rows: ${count}`);
    });

} catch (error) {
    console.error("Error reading file:", error);
}
