import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '..', 'data', 'Class 10 bseb hindi poetry section.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    console.log("File loaded:", filePath);
    console.log("Sheets:", workbook.SheetNames);

    if (workbook.SheetNames.length > 0) {
        const firstSheet = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
        console.log("First Sheet:", firstSheet);
        if (rows.length > 0) {
            console.log("Row 0 keys:", Object.keys(rows[0]));
            console.log("Row 0:", JSON.stringify(rows[0], null, 2));
        } else {
            console.log("Sheet is empty");
        }
    }
} catch (error) {
    console.error("Error reading file:", error.message);
}
