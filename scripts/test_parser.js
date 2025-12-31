const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx'); // Using xlsx as the app does, assuming it's available or we simulate standard csv parsing

const filePath = path.join(__dirname, '../data/raw_batches/batch1.csv');

try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    // Simulate what standard CSV parsing would do (basic split or using a library if we had one in node_modules, but we can just split by comma for this test since we know the format)

    const lines = fileContent.split(/\r?\n/);
    const headers = lines[0].split(',');

    console.log('Headers:', headers);

    // Find index of 'Correct Answer'
    const correctAnsIdx = headers.findIndex(h => h.trim() === 'Correct Answer');
    console.log('Correct Answer Index:', correctAnsIdx);

    // Check first 5 rows
    for (let i = 1; i <= 5 && i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Naive split (assuming no commas in fields for this test, or just checking the end)
        // The user's file is: Chapter,Question,A,B,C,D,Correct Answer
        // So Correct Answer is the LAST one.
        const parts = line.split(',');
        const rawAns = parts[parts.length - 1]; // Last part is Correct Answer

        console.log(`Row ${i} Raw Answer: "${rawAns}"`);

        // Validate Parser Logic
        let correctAns = -1;
        const val = rawAns.trim().toLowerCase();

        if (val === 'a' || val === 'option a') correctAns = 0;
        else if (val === 'b' || val === 'option b') correctAns = 1;
        else if (val === 'c' || val === 'option c') correctAns = 2;
        else if (val === 'd' || val === 'option d') correctAns = 3;
        else correctAns = parseInt(val) || 0;

        console.log(`  -> Parsed Index: ${correctAns}`);
    }

} catch (err) {
    console.error(err);
}
