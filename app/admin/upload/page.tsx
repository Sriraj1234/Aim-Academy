'use client'

import React, { useState, useRef } from 'react'
import { db } from '@/lib/firebase'
import { collection, writeBatch, doc, getDocs, setDoc, deleteDoc, query, limit } from 'firebase/firestore'
import { HiCloudUpload, HiCheck, HiX, HiTrash, HiArrowLeft, HiRefresh } from 'react-icons/hi'
import { motion } from 'framer-motion'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { Board, Class } from '@/data/types'
import { generateQuestionId } from '@/utils/idGenerator'

export default function AdminUploadPage() {
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<'idle' | 'parsing' | 'uploading' | 'success' | 'error'>('idle')
    const [progress, setProgress] = useState(0)
    const [log, setLog] = useState<string[]>([])
    const [selectedBoard, setSelectedBoard] = useState<Board>('cbse')
    const [selectedClass, setSelectedClass] = useState<Class>('10')
    const [autoTranslate, setAutoTranslate] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const logMessage = (msg: string) => {
        setLog(prev => [msg, ...prev].slice(0, 50))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setStatus('idle')
            setLog([])
            setProgress(0)
        }
    }

    const processFile = async () => {
        if (!file) return
        setStatus('parsing')
        logMessage("Reading file...")

        const reader = new FileReader()
        reader.onload = async (e) => {
            try {
                const data = e.target?.result
                const workbook = XLSX.read(data, { type: 'binary' })

                let allData: any[] = []
                logMessage(`Found ${workbook.SheetNames.length} sheets in the file.`)

                workbook.SheetNames.forEach(sheetName => {
                    const sheet = workbook.Sheets[sheetName]
                    const json: any[] = XLSX.utils.sheet_to_json(sheet)
                    logMessage(`Sheet "${sheetName}": ${json.length} rows found.`)
                    allData = [...allData, ...json]
                })

                if (allData.length === 0) {
                    throw new Error("No data found in any sheet.")
                }

                logMessage(`Total ${allData.length} questions parsed. Preparing upload...`)
                await uploadBatch(allData, 'General')
            } catch (err: any) {
                console.error(err)
                setStatus('error')
                logMessage(`Error parsing file: ${err.message}`)
            }
        }
        reader.readAsBinaryString(file)
    }

    const uploadBatch = async (questions: any[], defaultChapter: string) => {
        setStatus('uploading')
        const batchSize = 400
        const total = questions.length
        let processed = 0

        const getValue = (row: any, patterns: string[]): any => {
            const rowKeys = Object.keys(row);
            for (const pattern of patterns) {
                if (row[pattern] !== undefined) return row[pattern];
                const p = pattern.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, "");
                const foundKey = rowKeys.find(k => k.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, "") === p);
                if (foundKey && row[foundKey] !== undefined) return row[foundKey];
            }
            return undefined;
        }

        try {
            for (let i = 0; i < total; i += batchSize) {
                const chunk = questions.slice(i, i + batchSize)
                const batch = writeBatch(db)

                chunk.forEach((row) => {
                    let options: string[] = [];
                    const rawOptions = getValue(row, ['options', 'bikalp', 'vikalp']);

                    if (typeof rawOptions === 'string') {
                        options = rawOptions.split(',').map((opt: string) => opt.trim());
                    } else {
                        const valA = getValue(row, ['Option A', 'A', '(A)', 'Option 1', '1', 'a']);
                        const valB = getValue(row, ['Option B', 'B', '(B)', 'Option 2', '2', 'b']);
                        const valC = getValue(row, ['Option C', 'C', '(C)', 'Option 3', '3', 'c']);
                        const valD = getValue(row, ['Option D', 'D', '(D)', 'Option 4', '4', 'd']);
                        if (valA) options.push(valA.toString());
                        if (valB) options.push(valB.toString());
                        if (valC) options.push(valC.toString());
                        if (valD) options.push(valD.toString());
                    }

                    let correctAns = 0;
                    const rawCorrect = getValue(row, ['Correct Answer', 'Answer', 'Ans', 'Correct', 'Right Answer', 'Uttar']);
                    if (rawCorrect !== undefined) {
                        const val = rawCorrect.toString().trim();
                        const valLower = val.toLowerCase();

                        if (['a', 'option a', '1', '(a)'].some(s => valLower === s || valLower.startsWith(s + ')'))) correctAns = 0;
                        else if (['b', 'option b', '2', '(b)'].some(s => valLower === s || valLower.startsWith(s + ')'))) correctAns = 1;
                        else if (['c', 'option c', '3', '(c)'].some(s => valLower === s || valLower.startsWith(s + ')'))) correctAns = 2;
                        else if (['d', 'option d', '4', '(d)'].some(s => valLower === s || valLower.startsWith(s + ')'))) correctAns = 3;
                        else {
                            const matchIndex = options.findIndex(opt => opt.toLowerCase().trim() === valLower);
                            if (matchIndex !== -1) {
                                correctAns = matchIndex;
                            } else {
                                correctAns = (parseInt(val) || 1) - 1;
                                if (correctAns < 0 || correctAns > 3) correctAns = 0;
                            }
                        }
                    }

                    let rawSubject = (getValue(row, ['Subject', 'Sub', 'Vishay']) || 'General');
                    if (/^(option|otpion)\s*[a-d]$/i.test(rawSubject) || /^[a-d]$/i.test(rawSubject)) {
                        rawSubject = 'General';
                    }

                    const qData = {
                        question: getValue(row, ['Question', 'Q', 'Prashn', 'Sawl', 'text']) || '',
                        options: options.length > 0 ? options : ['A', 'B', 'C', 'D'],
                        correctAnswer: correctAns,
                        explanation: getValue(row, ['Explanation', 'Exp', 'Vyakhya']) || '',
                        subject: rawSubject.toLowerCase(),
                        chapter: (getValue(row, ['Chapter', 'Chap', 'Lesson', 'Adhyay']) || defaultChapter),
                        board: selectedBoard,
                        class: selectedClass,
                        active: true,
                        createdAt: Date.now()
                    }

                    // Mock Auto-Translate
                    let questionHi = getValue(row, ['Question (Hindi)', 'Q (Hindi)', 'Prashn (Hindi)']) || ''
                    let explanationHi = getValue(row, ['Explanation (Hindi)', 'Exp (Hindi)', 'Vyakhya (Hindi)']) || ''
                    let optionsHi: string[] = []

                    const rawOptionsHi = getValue(row, ['options (Hindi)', 'bikalp (Hindi)', 'vikalp (Hindi)'])
                    if (rawOptionsHi) {
                        optionsHi = rawOptionsHi.split(',').map((o: string) => o.trim()).filter((o: string) => o)
                    } else {
                        const oA = getValue(row, ['Option A (Hindi)', 'A (Hindi)'])
                        const oB = getValue(row, ['Option B (Hindi)', 'B (Hindi)'])
                        const oC = getValue(row, ['Option C (Hindi)', 'C (Hindi)'])
                        const oD = getValue(row, ['Option D (Hindi)', 'D (Hindi)'])
                        if (oA || oB || oC || oD) {
                            optionsHi = [oA, oB, oC, oD].filter(o => o)
                        }
                    }

                    if (autoTranslate) {
                        if (!questionHi && qData.question) questionHi = `${qData.question} [Hindi]`
                        if (!explanationHi && qData.explanation) explanationHi = `${qData.explanation} [Hindi]`
                        if (optionsHi.length === 0 && options.length > 0) {
                            optionsHi = options.map(o => `${o} [Hindi]`)
                        }
                    }

                    const finalQData = {
                        ...qData,
                        questionHi,
                        explanationHi,
                        optionsHi: optionsHi.length > 0 ? optionsHi : undefined
                    }

                    const docId = generateQuestionId(qData.question, qData.board, qData.class, qData.subject)
                    const docRef = doc(db, "questions", docId)

                    batch.set(docRef, finalQData)
                })

                await batch.commit()
                processed += chunk.length
                setProgress(Math.round((processed / total) * 100))
                logMessage(`Uploaded ${processed}/${total} questions...`)
            }

            setStatus('success')
            logMessage("Upload complete!")
            await scanMetadata()

        } catch (error: any) {
            console.error(error)
            setStatus('error')
            logMessage(`Upload failed: ${error.message}`)
        }
    }

    const scanMetadata = async () => {
        setStatus('parsing')
        logMessage("Updating Metadata...")
        try {
            const querySnapshot = await getDocs(collection(db, "questions"))
            const TaxonomyMap: Record<string, { subjects: Set<string>, chapters: Record<string, Map<string, number>> }> = {}

            querySnapshot.forEach((doc) => {
                const data = doc.data()
                const sub = data.subject ? data.subject.toLowerCase() : 'other'
                const chap = data.chapter ? data.chapter : 'General'
                const board = data.board || 'other'
                const cls = data.class || 'other'

                const key = `${board}_${cls}`

                if (!TaxonomyMap[key]) {
                    TaxonomyMap[key] = {
                        subjects: new Set(),
                        chapters: {}
                    }
                }

                TaxonomyMap[key].subjects.add(sub)

                if (!TaxonomyMap[key].chapters[sub]) {
                    TaxonomyMap[key].chapters[sub] = new Map()
                }

                const currentCount = TaxonomyMap[key].chapters[sub].get(chap) || 0
                TaxonomyMap[key].chapters[sub].set(chap, currentCount + 1)
            })

            const finalTaxonomy: Record<string, any> = {}

            Object.keys(TaxonomyMap).forEach(key => {
                const validSubjects = Array.from(TaxonomyMap[key].subjects)
                    .filter(s => {
                        const isOption = /^(option|otpion)\s*[a-d0-9]$/i.test(s) || /^[a-d]$/i.test(s) || s.length < 2
                        return !isOption
                    })
                    .sort()

                if (validSubjects.length > 0) {
                    finalTaxonomy[key] = {
                        subjects: validSubjects,
                        chapters: validSubjects.reduce((acc, sub) => {
                            if (TaxonomyMap[key].chapters[sub]) {
                                const chapMap = TaxonomyMap[key].chapters[sub]
                                acc[sub] = Array.from(chapMap.keys())
                                    .sort()
                                    .map(name => ({ name, count: chapMap.get(name) || 0 }))
                            }
                            return acc
                        }, {} as Record<string, any[]>)
                    }
                }
            })
            await setDoc(doc(db, "metadata", "taxonomy"), {
                ...finalTaxonomy,
                lastUpdated: Date.now()
            })
            setStatus('success')
            logMessage("Metadata updated! (Segmented by Board/Class)")
        } catch (error: any) {
            console.error(error)
            setStatus('error')
            logMessage(`Error scanning metadata: ${error.message}`)
        }
    }

    const handleClearDatabase = async () => {
        if (!confirm("Delete ALL questions?")) return
        setStatus('parsing')
        try {
            const qRef = collection(db, "questions")
            const snapshot = await getDocs(qRef)
            const batch = writeBatch(db)
            snapshot.docs.forEach(doc => batch.delete(doc.ref))
            await batch.commit()
            logMessage(`Deleted ${snapshot.size} questions.`)
            setStatus('idle')
        } catch (e: any) { setStatus('error'); logMessage(e.message) }
    }

    return (
        <div className="min-h-screen bg-pw-surface p-8 font-sans">
            <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-pw-xl border border-pw-border p-8 md:p-12 relative overflow-hidden">
                {/* Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-pw-indigo/5 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="flex justify-between items-center mb-10 relative z-10">
                    <div>
                        <Link href="/admin" className="text-gray-400 font-bold hover:text-pw-indigo flex items-center gap-1 mb-2">
                            <HiArrowLeft /> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-display font-bold text-pw-violet">Upload Questions</h1>
                        <p className="text-gray-500 font-medium">Bulk import content from Excel or CSV files.</p>
                    </div>
                </div>

                {/* SELECTORS */}
                <div className="grid grid-cols-2 gap-6 mb-10 p-6 bg-pw-surface rounded-2xl border border-pw-border">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Select Board</label>
                        <select
                            value={selectedBoard}
                            onChange={(e) => setSelectedBoard(e.target.value as Board)}
                            className="w-full p-4 rounded-xl border border-pw-border bg-white text-gray-800 font-medium outline-none focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 transition-all capitalize"
                        >
                            <option value="cbse">CBSE</option>
                            <option value="icse">ICSE</option>
                            <option value="bseb">BSEB (Bihar)</option>
                            <option value="up">UP Board</option>
                            <option value="mp">MP Board</option>
                            <option value="maharashtra">Maharashtra</option>
                            <option value="rbse">RBSE (Rajasthan)</option>
                            <option value="jac">JAC (Jharkhand)</option>
                            <option value="uk">UK Board</option>
                            <option value="wb">WB Board</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Select Class</label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value as Class)}
                            className="w-full p-4 rounded-xl border border-pw-border bg-white text-gray-800 font-medium outline-none focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 transition-all"
                        >
                            <option value="9">Class 9</option>
                            <option value="10">Class 10</option>
                            <option value="11">Class 11</option>
                            <option value="12">Class 12</option>
                        </select>
                    </div>
                </div>

                {/* FILE UPLOAD */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 relative z-10">
                    <div className="bg-pw-surface/50 p-6 rounded-[2rem] border border-pw-border hover:border-pw-indigo/30 transition-colors">
                        <h2 className="font-bold text-xl text-pw-violet mb-6 flex items-center gap-2">
                            <span className="w-10 h-10 rounded-xl bg-pw-indigo/10 flex items-center justify-center text-pw-indigo"><HiCloudUpload /></span>
                            Upload File
                        </h2>

                        <div className="relative mb-6 group">
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-pw-indigo file:text-white file:font-bold hover:file:bg-pw-violet file:transition-colors file:cursor-pointer cursor-pointer"
                            />
                        </div>

                        <div className="flex items-center gap-2 mb-6 bg-white p-3 rounded-xl border border-pw-border inline-flex">
                            <input
                                type="checkbox"
                                id="autoTranslate"
                                checked={autoTranslate}
                                onChange={(e) => setAutoTranslate(e.target.checked)}
                                className="w-5 h-5 text-pw-indigo rounded border-gray-300 focus:ring-pw-indigo accent-pw-indigo"
                            />
                            <label htmlFor="autoTranslate" className="text-sm text-gray-700 font-bold select-none cursor-pointer">
                                Auto-translate to Hindi
                            </label>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={processFile}
                                disabled={!file || status === 'uploading'}
                                className="flex-1 bg-gradient-to-r from-pw-indigo to-pw-violet hover:shadow-pw-lg text-white px-6 py-3.5 rounded-xl font-bold disabled:opacity-50 transition-all active:scale-95"
                            >
                                {status === 'uploading' ? 'Uploading...' : 'Process & Upload'}
                            </button>
                            <button
                                onClick={() => {
                                    const template = [['Subject', 'Chapter', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Explanation']];
                                    const ws = XLSX.utils.aoa_to_sheet(template);
                                    const wb = XLSX.utils.book_new();
                                    XLSX.utils.book_append_sheet(wb, ws, "Template");
                                    XLSX.writeFile(wb, "question_template.xlsx");
                                }}
                                className="bg-white border border-pw-border text-gray-600 px-6 py-3.5 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                            >
                                Template
                            </button>
                        </div>
                    </div>

                    <div className="bg-pw-surface/50 p-6 rounded-[2rem] border border-pw-border space-y-4">
                        <h2 className="font-bold text-xl text-pw-violet mb-4">Maintenance</h2>
                        <button onClick={scanMetadata} disabled={status === 'parsing'} className="w-full bg-blue-50 text-blue-600 px-4 py-4 rounded-xl font-bold hover:bg-blue-100 transition-colors border border-blue-100 flex items-center justify-center gap-2">
                            <HiRefresh /> Rescan Metadata
                        </button>
                        <div className="h-px bg-gray-200 my-2"></div>
                        <button onClick={handleClearDatabase} className="w-full bg-red-50 text-red-600 px-4 py-4 rounded-xl font-bold hover:bg-red-100 transition-colors border border-red-100 flex items-center justify-center gap-2">
                            <HiTrash /> Clear Database
                        </button>
                    </div>
                </div>

                {/* LOGS */}
                <div className="bg-gray-900 text-gray-300 p-6 rounded-2xl font-mono text-xs h-64 overflow-y-auto border border-gray-800 shadow-inner">
                    <p className="text-gray-500 mb-2 border-b border-gray-800 pb-2 uppercase tracking-widest font-bold">System Logs</p>
                    {log.map((l, i) => <p key={i} className="mb-1.5 font-medium"><span className="text-gray-600 mr-2">{new Date().toLocaleTimeString()}</span>{l}</p>)}
                    {log.length === 0 && <p className="text-gray-600 italic">Ready to engage...</p>}
                </div>
            </div>
        </div>
    )
}
