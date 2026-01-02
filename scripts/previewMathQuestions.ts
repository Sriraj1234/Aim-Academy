'use strict';

/**
 * Script to upload Math questions from Excel to Firestore
 * Usage: npx ts-node scripts/uploadMathQuestions.ts
 */

import * as XLSX from 'xlsx';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';

// Firebase Admin initialization
// You need to set up a service account key or use application default credentials

const EXCEL_FILE_PATH = path.join(__dirname, '../data/Class 10 bseb Math.xlsx');

interface ParsedQuestion {
    subject: string;
    chapter: string;
    question: string;
    options: string[];
    correctAnswer: number;
    board: string;
    class: string;
    stream: string;
    mainSubject: string | null;
    isValid: boolean;
}

function normalizeKey(k: string): string {
    return k.toLowerCase().trim();
}

function findOptionKey(keys: string[], letter: string): string | undefined {
    const candidates = [`option ${letter}`, `opt ${letter}`, `(${letter})`, `${letter})`];
    // First: Exact match
    let key = keys.find(k => candidates.includes(normalizeKey(k)));
    // Second: Loose match (contains "option" and the letter)
    if (!key) {
        key = keys.find(k => normalizeKey(k).includes('option') && normalizeKey(k).includes(letter));
    }
    // Third: Just the letter (e.g., column named "A", "B")
    if (!key) {
        key = keys.find(k => normalizeKey(k) === letter);
    }
    return key;
}

function parseRow(row: any, sheetName: string, index: number): ParsedQuestion {
    const keys = Object.keys(row);
    const normalize = normalizeKey;

    // Subject detection
    const explicitSubjectKeys = ['subject', 'sub', 'subject name', 'subjects', 'subject_name', 'course'];
    let subjectKey = keys.find(k => explicitSubjectKeys.includes(normalize(k)));
    if (!subjectKey) {
        subjectKey = keys.find(k => {
            const norm = normalize(k);
            return (norm.includes('subject') && !norm.includes('main')) || norm === 'sub';
        });
    }
    const subjectRaw = subjectKey ? row[subjectKey] : 'mathematics';
    const subject = String(subjectRaw).toLowerCase();

    // Chapter detection
    const chapterKey = keys.find(k =>
        ['chapter', 'topic', 'unit', 'lesson', 'chap'].some(keyword => normalize(k).includes(keyword))
    );
    const chapter = chapterKey ? String(row[chapterKey]) : sheetName; // Use sheet name as chapter fallback

    // Question detection
    const questionCandidates = ['question', 'question text', 'q', 'questions', 'qs', 'problem'];
    let questionKey = keys.find(k => questionCandidates.includes(normalize(k)));
    if (!questionKey) {
        questionKey = keys.find(k => normalize(k).includes('question'));
    }
    const question = questionKey ? String(row[questionKey]) : '';

    // Options
    const options = [
        findOptionKey(keys, 'a') ? String(row[findOptionKey(keys, 'a')!] ?? '') : '',
        findOptionKey(keys, 'b') ? String(row[findOptionKey(keys, 'b')!] ?? '') : '',
        findOptionKey(keys, 'c') ? String(row[findOptionKey(keys, 'c')!] ?? '') : '',
        findOptionKey(keys, 'd') ? String(row[findOptionKey(keys, 'd')!] ?? '') : ''
    ];

    // Correct Answer
    let correctAnswer = 0;
    const ansCandidates = ['correct answer', 'correct', 'answer', 'ans', 'correct_option'];
    let ansKey = keys.find(k => ansCandidates.includes(normalize(k)));
    if (!ansKey) {
        ansKey = keys.find(k => normalize(k).includes('answer') || normalize(k).includes('correct'));
    }
    const rawAns = (ansKey ? row[ansKey] : '').toString().trim().toLowerCase();

    if (rawAns === 'a' || rawAns === 'option a') correctAnswer = 0;
    else if (rawAns === 'b' || rawAns === 'option b') correctAnswer = 1;
    else if (rawAns === 'c' || rawAns === 'option c') correctAnswer = 2;
    else if (rawAns === 'd' || rawAns === 'option d') correctAnswer = 3;
    else {
        // Try text match
        const idx = options.findIndex(opt => opt && opt.trim().toLowerCase() === rawAns);
        if (idx !== -1) correctAnswer = idx;
    }

    // Main Subject
    const mainSubjectKey = keys.find(k => ['main subject', 'main_subject', 'mainsubject'].includes(normalize(k)));
    const mainSubject = mainSubjectKey ? String(row[mainSubjectKey]) : null;

    return {
        subject,
        chapter,
        question,
        options,
        correctAnswer,
        board: 'bseb',
        class: '10',
        stream: 'science',
        mainSubject,
        isValid: !!(question && options[0] && options[1])
    };
}

function generateQuestionId(questionText: string, board: string, cls: string, subject: string): string {
    const q = questionText.trim().toLowerCase().replace(/\s+/g, ' ');
    const b = board.trim().toLowerCase();
    const c = cls.trim().toLowerCase();
    const s = subject.trim().toLowerCase();

    const str = `${b}-${c}-${s}-${q}`;

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    const hashStr = (hash >>> 0).toString(16);
    return `${b}_${c}_${s}_${hashStr}`;
}

async function main() {
    console.log('=== Math Questions Upload Script ===');
    console.log('Loading Excel file:', EXCEL_FILE_PATH);

    if (!fs.existsSync(EXCEL_FILE_PATH)) {
        console.error('ERROR: Excel file not found!');
        process.exit(1);
    }

    // Read Excel file
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    console.log('Sheets found:', workbook.SheetNames.length, workbook.SheetNames);

    const allQuestions: ParsedQuestion[] = [];

    // Parse all sheets
    workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet);

        console.log(`Sheet "${sheetName}": ${rows.length} rows`);

        rows.forEach((row: any, index) => {
            const parsed = parseRow(row, sheetName, index);
            allQuestions.push(parsed);
        });
    });

    const validQuestions = allQuestions.filter(q => q.isValid);
    const invalidQuestions = allQuestions.filter(q => !q.isValid);

    console.log('\n=== PARSING SUMMARY ===');
    console.log('Total rows:', allQuestions.length);
    console.log('Valid questions:', validQuestions.length);
    console.log('Invalid questions:', invalidQuestions.length);

    if (invalidQuestions.length > 0) {
        console.log('\nFirst 5 invalid questions:');
        invalidQuestions.slice(0, 5).forEach((q, i) => {
            console.log(`  ${i + 1}. "${q.question?.substring(0, 50)}..." Options: [${q.options.join(', ')}]`);
        });
    }

    console.log('\nFirst 3 valid questions:');
    validQuestions.slice(0, 3).forEach((q, i) => {
        console.log(`  ${i + 1}. Subject: ${q.subject}, Chapter: ${q.chapter}`);
        console.log(`     Q: ${q.question?.substring(0, 60)}...`);
        console.log(`     Options: ${q.options.map((o, idx) => `${String.fromCharCode(65 + idx)}. ${o?.substring(0, 15)}`).join(' | ')}`);
        console.log(`     Answer: ${String.fromCharCode(65 + q.correctAnswer)}`);
    });

    console.log('\n=== READY TO UPLOAD ===');
    console.log('NOTE: This script shows parsed data only.');
    console.log('To actually upload, use the Admin Upload page with this file.');
}

main().catch(console.error);
