const XLSX = require('xlsx');
const path = require('path');
const FILE_PATH = path.join(__dirname, '../data/Social science class 10 bseb.xlsx'); // Original file

console.log(`Reading file: ${FILE_PATH}`);
const workbook = XLSX.readFile(FILE_PATH);

function getValue(row, patterns) {
    if (!row || typeof row !== 'object') return undefined;
    const rowKeys = Object.keys(row);
    for (const pattern of patterns) {
        if (row[pattern] !== undefined) return row[pattern];
        const p = pattern.toLowerCase().replace(/[^a-z0-9]/g, "");
        const foundKey = rowKeys.find(k => {
            const normalized = k.toLowerCase().replace(/[^a-z0-9]/g, "");
            return normalized === p;
        });
        if (foundKey && row[foundKey] !== undefined) return row[foundKey];
    }
    return undefined;
}

workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);
    const geoRows = rows.filter(r => {
        const sub = getValue(r, ['Subject', 'Sub']);
        return (sub || '').trim().toLowerCase() === 'geography';
    });

    if (geoRows.length > 0) {
        console.log(`\n=== Sheet: ${sheetName} ===`);
        console.log(`Geography Rows: ${geoRows.length}`);
        const uniqueChaps = new Set(geoRows.map(r => {
            return getValue(r, ['Chapter', 'Chap', 'Chapter Name']) || 'EMPTY';
        }));
        console.log("Unique Chapters (Original):", Array.from(uniqueChaps));
    }
});
