const XLSX = require('xlsx');
const path = require('path');
const FILE_PATH = path.join(__dirname, '../data/Social Science class10 bseb fixed.xlsx');

const workbook = XLSX.readFile(FILE_PATH);

function getValue(row, patterns) {
    if (!row || typeof row !== 'object') return undefined;
    const rowKeys = Object.keys(row);
    for (const pattern of patterns) {
        if (row[pattern] !== undefined) return row[pattern];
        const p = pattern.toLowerCase().replace(/[^a-z0-9]/g, "");
        const foundKey = rowKeys.find(k => {
            const normalized = k.toLowerCase().replace(/[^a-z0-9]/g, "");
            return normalized === p || normalized.includes(p) || p.includes(normalized);
        });
        if (foundKey && row[foundKey] !== undefined) return row[foundKey];
    }
    return undefined;
}

const targetText = "दक्षिण भारत की";

workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    // Search in Question column
    const found = rows.find(r => {
        const q = getValue(r, ['Question', 'Q', 'text']);
        return q && String(q).includes(targetText);
    });

    if (found) {
        console.log(`Found in sheet: ${sheetName}`);
        const fs = require('fs');
        fs.writeFileSync('found_question.json', JSON.stringify(found, null, 2));
    }
});
