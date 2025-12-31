const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '../data/raw_batches');
const outputFile = path.join(__dirname, '../data/questions_import.json');

try {
    if (!fs.existsSync(inputDir)) {
        console.error(`Input directory ${inputDir} does not exist.`);
        process.exit(1);
    }

    const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.csv') || f.endsWith('.txt'));
    let allQuestions = [];

    files.forEach(file => {
        const filePath = path.join(inputDir, file);
        console.log(`Processing ${file}...`);
        const rawData = fs.readFileSync(filePath, 'utf8');
        const lines = rawData.split(/\r?\n/);

        lines.forEach((line, index) => {
            line = line.trim();
            if (!line) return;
            if (line.startsWith('Batch') || line.startsWith('Chapter,Question') || line.startsWith('Note:') || line.startsWith('विशेषताएं') || line.startsWith('•')) return;

            const parts = line.split(',');
            if (parts.length < 7) return;

            const rightOptionRaw = parts[parts.length - 1].trim();
            const d = parts[parts.length - 2].trim();
            const c = parts[parts.length - 3].trim();
            const b = parts[parts.length - 4].trim();
            const a = parts[parts.length - 5].trim();
            const chapter = parts[0].trim();
            const questionText = parts.slice(1, parts.length - 5).join(',').trim();

            let answerIndex = 0;
            const lowerAns = rightOptionRaw.toLowerCase();
            if (lowerAns.includes('option a') || lowerAns === 'a') answerIndex = 0;
            else if (lowerAns.includes('option b') || lowerAns === 'b') answerIndex = 1;
            else if (lowerAns.includes('option c') || lowerAns === 'c') answerIndex = 2;
            else if (lowerAns.includes('option d') || lowerAns === 'd') answerIndex = 3;

            allQuestions.push({
                question: questionText,
                options: [a, b, c, d],
                correctAnswer: answerIndex,
                subject: 'Hindi', // Default subject
                chapter: chapter,
                difficulty: 'medium',
                marks: 1,
                year: 2024,
                type: 'mcq'
            });
        });
    });

    fs.writeFileSync(outputFile, JSON.stringify(allQuestions, null, 2));
    console.log(`Successfully converted ${allQuestions.length} questions from ${files.length} files.`);
    console.log(`Saved to ${outputFile}`);

} catch (err) {
    console.error('Error processing files:', err);
}
