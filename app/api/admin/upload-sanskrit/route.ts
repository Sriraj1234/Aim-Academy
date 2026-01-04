import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log("Starting Sanskrit Question Upload...");

        // Hardcoded path confirmed to work
        const filePath = "e:\\AIM 2\\aim-academy\\data\\Class 10 sanskrit bihar board.xlsx";
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ success: false, error: "File not found at " + filePath });
        }

        const workbook = XLSX.readFile(filePath);
        const sheetNames = workbook.SheetNames;
        console.log("Found sheets:", sheetNames);

        let totalUploaded = 0;
        const questionsCollection = collection(db, 'questions');
        const taxonomyUpdates: Record<string, any> = {};

        // 2. Iterate Sheets
        for (const sheetName of sheetNames) {
            console.log(`Processing sheet: ${sheetName}`);
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // 3. Parse Rows - CAST TO ANY[] to avoid TS error
            for (const row of jsonData as any[]) {
                // Fallbacks if column names slightly differ
                const questionText = row['Question'] || row['question'] || row['प्रश्न'];
                if (!questionText) continue; // Skip empty rows

                const chapter = (row['Chapter'] || row['chapter'] || sheetName).toString().trim();
                const optionA = row['Option A'] || row['option a'] || row['A'];
                const optionB = row['Option B'] || row['option b'] || row['B'];
                const optionC = row['Option C'] || row['option c'] || row['C'];
                const optionD = row['Option D'] || row['option d'] || row['D'];

                let rawAnswer = (row['Correct Answer'] || row['correct answer'] || row['Answer'] || '').toString().trim().toLowerCase();

                // 4. Normalize Answer
                let correctAnswer = '';
                if (rawAnswer.includes('a') || rawAnswer.includes('option a') || rawAnswer.includes('विकल्प a')) correctAnswer = 'a';
                else if (rawAnswer.includes('b') || rawAnswer.includes('option b') || rawAnswer.includes('विकल्प b')) correctAnswer = 'b';
                else if (rawAnswer.includes('c') || rawAnswer.includes('option c') || rawAnswer.includes('विकल्प c')) correctAnswer = 'c';
                else if (rawAnswer.includes('d') || rawAnswer.includes('option d') || rawAnswer.includes('विकल्प d')) correctAnswer = 'd';

                // Hindi mapping (just in case)
                if (!correctAnswer) {
                    if (rawAnswer.includes('क')) correctAnswer = 'a';
                    else if (rawAnswer.includes('ख')) correctAnswer = 'b';
                    else if (rawAnswer.includes('ग')) correctAnswer = 'c';
                    else if (rawAnswer.includes('घ')) correctAnswer = 'd';
                }

                if (!correctAnswer) {
                    // Fallback: Check if raw answer matches one of the option texts exactly
                    if (optionA && rawAnswer === optionA.toString().toLowerCase().trim()) correctAnswer = 'a';
                    else if (optionB && rawAnswer === optionB.toString().toLowerCase().trim()) correctAnswer = 'b';
                    else if (optionC && rawAnswer === optionC.toString().toLowerCase().trim()) correctAnswer = 'c';
                    else if (optionD && rawAnswer === optionD.toString().toLowerCase().trim()) correctAnswer = 'd';
                }

                if (!correctAnswer) {
                    console.log(`Skipping Q: ${questionText.substring(0, 20)}... - Could not deteremine answer from "${row['Correct Answer']}"`);
                    continue;
                }

                // 5. Build Question Object
                const newQuestion = {
                    subject: 'sanskrit',
                    chapter: chapter,
                    question: questionText,
                    options: {
                        a: optionA || '',
                        b: optionB || '',
                        c: optionC || '',
                        d: optionD || ''
                    },
                    correctAnswer: correctAnswer,
                    board: 'bseb',
                    class: '10',
                    createdAt: new Date().toISOString()
                };

                try {
                    // 6. Upload
                    await addDoc(questionsCollection, newQuestion);
                    totalUploaded++;
                } catch (rowError: any) {
                    console.error(`Failed to upload row: ${JSON.stringify(newQuestion)}`, rowError);
                }
            }
        }

        return NextResponse.json({
            success: true,
            totalUploaded,
            sheetsProcessed: sheetNames
        });

    } catch (error: any) {
        console.error("Upload failed:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
