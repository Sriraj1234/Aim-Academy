const XLSX = require('xlsx');
const path = require('path');
const FILE_PATH = path.join(__dirname, '../data/Social Science class10 bseb fixed.xlsx');

const workbook = XLSX.readFile(FILE_PATH);

const chapters = new Set();

workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    // Normalize keys to find Subject
    const getVal = (r, key) => {
        const k = Object.keys(r).find(x => x.toLowerCase() === key.toLowerCase());
        return k ? r[k] : undefined;
    };

    rows.forEach(r => {
        const s = (getVal(r, 'Subject') || 'Social Science').trim();
        if (s.toLowerCase() === 'social science') {
            const ch = getVal(r, 'Chapter');
            if (ch) chapters.add(ch.trim());
        }
    });
});

const sortedChapters = Array.from(chapters).sort();
console.log("Social Science Chapters:", sortedChapters);

const fs = require('fs');
fs.writeFileSync('sst_chapters.json', JSON.stringify(sortedChapters, null, 2));
