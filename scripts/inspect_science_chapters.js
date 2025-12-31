const XLSX = require('xlsx');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/Class 10 Bseb Science .xlsx');

if (!require('fs').existsSync(FILE_PATH)) {
    console.error("File not found!", FILE_PATH);
    process.exit(1);
}

const workbook = XLSX.readFile(FILE_PATH);
const chapters = new Set();
const subSubjects = new Set();

workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet);

    json.forEach(row => {
        // Helper to find value
        const getValue = (row, patterns) => {
            const rowKeys = Object.keys(row);
            for (const pattern of patterns) {
                if (row[pattern] !== undefined) return row[pattern];
                const p = pattern.toLowerCase().replace(/[^a-z0-9]/g, "");
                const foundKey = rowKeys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, "") === p);
                if (foundKey && row[foundKey] !== undefined) return row[foundKey];
            }
            return undefined;
        };

        const chapter = (getValue(row, ['Chapter', 'Chap']) || 'General').trim().replace(/\s+/g, ' ');
        const sub = (getValue(row, ['Sub-subject', 'Sub Subject', 'Section', 'Part', 'Branch']) || '').trim();

        if (chapter) chapters.add(chapter);
        if (sub) subSubjects.add(sub);
    });
});

console.log("Unique Chapters:");
Array.from(chapters).sort().forEach(c => console.log(`- ${c}`));

console.log("\nUnique Sub-subjects:");
Array.from(subSubjects).sort().forEach(s => console.log(`- ${s}`));
