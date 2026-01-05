const XLSX = require('xlsx');
const path = require('path');
const FILE_PATH = path.join(__dirname, '../data/Social Science class10 bseb fixed.xlsx');

function getValue(row, patterns) {
    if (!row || typeof row !== 'object') return undefined;
    const rowKeys = Object.keys(row);

    for (const pattern of patterns) {
        // Exact match first
        if (row[pattern] !== undefined) return row[pattern];

        // Fuzzy match - normalize both sides
        const p = pattern.toLowerCase().replace(/[^a-z0-9]/g, "");
        const foundKey = rowKeys.find(k => {
            const normalized = k.toLowerCase().replace(/[^a-z0-9]/g, "");
            return normalized === p || normalized.includes(p) || p.includes(normalized);
        });
        if (foundKey && row[foundKey] !== undefined) return row[foundKey];
    }
    return undefined;
}

console.log(`Reading file: ${FILE_PATH}`);
const workbook = XLSX.readFile(FILE_PATH);

// Find Geography rows and check their chapter values
workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    // Find Geography rows
    const geoRows = rows.filter(r => {
        const sub = getValue(r, ['Subject', 'Sub']);
        return (sub || '').trim().toLowerCase() === 'geography';
    });

    if (geoRows.length > 0) {
        console.log(`\n=== Sheet: ${sheetName} ===`);
        console.log(`Geography Rows: ${geoRows.length}`);

        // Get unique chapters
        const uniqueChaps = new Set(geoRows.map(r => {
            return getValue(r, [
                'Chapter',
                'Chap',
                'Chapter name in hindi',
                'Chapter Name in Hindi',
                'Chapter Name (Hindi)',
                'Chapter name in Hindi',
                'chapter name in hindi',
                'chapter'
            ]) || 'EMPTY';
        }));
        const chapters = Array.from(uniqueChaps);
        console.log("Unique Chapters in Excel:", chapters);

        const fs = require('fs');
        fs.writeFileSync('geo_excel_chapters.json', JSON.stringify(chapters, null, 2));

        if (geoRows.length > 0) {
            const fs = require('fs');
            fs.writeFileSync('sample_row.json', JSON.stringify(geoRows[0], null, 2));
            console.log("Sample row written to sample_row.json");
        }
    }
});
