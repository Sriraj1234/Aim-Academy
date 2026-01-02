'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/shared/Header'
import { MediaUploader } from '@/components/admin/MediaUploader'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, deleteDoc, doc, writeBatch, where } from 'firebase/firestore'
import { FaBook, FaSave, FaLock, FaTrash, FaQuestionCircle, FaFileExcel, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'
import { useAuth } from '@/hooks/useAuth'
import * as XLSX from 'xlsx'
import { generateQuestionId } from '@/utils/idGenerator'

const UploadPage = () => {
    const { user } = useAuth()

    const [activeTab, setActiveTab] = useState<'notes' | 'questions'>('notes')
    const [loading, setLoading] = useState(false)

    // Notes Form State
    const [formData, setFormData] = useState({
        title: '',
        subject: 'physics',
        chapter: '',
        class: '10',
        board: 'CBSE',
        pdfUrl: '',
    })

    // Global Metadata State (for Bulk Upload)
    const [globalSettings, setGlobalSettings] = useState({
        class: '10',
        board: 'CBSE',
        stream: 'Science'
    })

    // Questions Upload State
    const [uploadProgress, setUploadProgress] = useState('')
    const [parsedSheets, setParsedSheets] = useState<{ name: string, questions: any[] }[]>([])
    const [activeSheet, setActiveSheet] = useState(0)
    const [previewMode, setPreviewMode] = useState(false)
    const [uploadingQuestions, setUploadingQuestions] = useState(false)
    const [uploadStats, setUploadStats] = useState({ total: 0, success: 0, failed: 0 })

    // Notes State (Moved up to fix Hooks Rule)
    const [notes, setNotes] = useState<any[]>([])

    // Fetch Notes on Load
    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const q = query(collection(db, 'notes'), orderBy('uploadedAt', 'desc'))
                const snapshot = await getDocs(q)
                setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
            } catch (error) {
                console.error("Error fetching notes:", error)
            }
        }
        fetchNotes()
    }, [])

    const handleQuestionFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })

                const sheetsData: { name: string, rows: any[] }[] = []

                // MULTI-SHEET SUPPORT: Iterate all sheets but keep them separate
                wb.SheetNames.forEach(sheetName => {
                    const ws = wb.Sheets[sheetName]
                    const sheetData = XLSX.utils.sheet_to_json(ws)
                    if (sheetData.length > 0) {
                        sheetsData.push({ name: sheetName, rows: sheetData })
                    }
                })

                console.log(`Parsed ${sheetsData.length} sheets.`)
                processParsedData(sheetsData)
            } catch (error) {
                console.error("Error parsing file", error)
                alert("Failed to parse Excel file. Please check the format.")
            }
        }
        reader.readAsBinaryString(file)
    }

    const processParsedData = (sheets: { name: string, rows: any[] }[]) => {
        const processedSheets = sheets.map(sheet => {
            const processedQuestions = sheet.rows.map((row: any, index) => {
                // Helper: Get all keys
                const keys = Object.keys(row);
                const normalize = (k: string) => k.toLowerCase().trim();

                // Smart Key Finder
                const findKeySmart = (candidates: string[], looseMatch?: string) => {
                    // 1. Try exact matches (normalized)
                    const exact = keys.find(k => candidates.includes(normalize(k)));
                    if (exact) return exact;

                    // 2. Try loose match (contains)
                    if (looseMatch) {
                        return keys.find(k => normalize(k).includes(looseMatch));
                    }
                    return undefined;
                }

                const mainSubjectKey = findKeySmart(['main subject', 'main_subject', 'mainsubject']);
                const mainSubject = mainSubjectKey ? row[mainSubjectKey] : null;

                // For Subject: Look for "subject", "sub" OR any key containing "subject" (but exclude "main")
                let subjectKey = keys.find(k => ['subject', 'sub', 'subject name', 'subjects'].includes(normalize(k)));
                if (!subjectKey) {
                    // Fallback: Contains 'subject' but NOT 'main' (to avoid Main Subject overlap)
                    subjectKey = keys.find(k => normalize(k).includes('subject') && !normalize(k).includes('main'));
                }
                const subjectRaw = subjectKey ? row[subjectKey] : 'general';
                const subject = String(subjectRaw).toLowerCase();

                // For Chapter: Look for "chapter", "topic", "unit", "lesson"
                const chapterKey = findKeySmart(['chapter', 'topic', 'unit', 'lesson'], 'chapter');
                const chapter = chapterKey ? row[chapterKey] : 'General';

                const questionKey = findKeySmart(['question', 'question text', 'q', 'questions'], 'question');
                const question = questionKey ? row[questionKey] : '';

                // Options - Force string conversion for numbers (e.g. 2024, 0)
                const findOptionKey = (letter: string) => findKeySmart([`option ${letter}`, `opt ${letter}`, `(${letter})`, `${letter}`]);

                const options = [
                    findOptionKey('a') ? String(row[findOptionKey('a')!]) : '',
                    findOptionKey('b') ? String(row[findOptionKey('b')!]) : '',
                    findOptionKey('c') ? String(row[findOptionKey('c')!]) : '',
                    findOptionKey('d') ? String(row[findOptionKey('d')!]) : ''
                ];

                // Correct Answer Logic
                let correctAnswer = 0; // Default to A

                const ansKey = findKeySmart(['correct answer', 'correct', 'answer', 'ans']);
                const rawAns = (ansKey ? row[ansKey] : '').toString().trim();

                if (rawAns.toLowerCase() === 'a' || rawAns.toLowerCase() === 'option a') correctAnswer = 0;
                else if (rawAns.toLowerCase() === 'b' || rawAns.toLowerCase() === 'option b') correctAnswer = 1;
                else if (rawAns.toLowerCase() === 'c' || rawAns.toLowerCase() === 'option c') correctAnswer = 2;
                else if (rawAns.toLowerCase() === 'd' || rawAns.toLowerCase() === 'option d') correctAnswer = 3;
                else {
                    // Try to match text
                    const idx = options.findIndex(opt => opt && String(opt).trim().toLowerCase() === rawAns.toLowerCase());
                    if (idx !== -1) correctAnswer = idx;
                }

                // Apply specific row override OR global setting
                const classKey = findKeySmart(['class', 'grade', 'standard']);
                const rowClass = classKey ? row[classKey].toString() : globalSettings.class;

                const boardKey = findKeySmart(['board']);
                const rowBoard = (boardKey ? row[boardKey] : globalSettings.board).toString().toLowerCase();

                const streamKey = findKeySmart(['stream']);
                const rowStream = (streamKey ? row[streamKey] : globalSettings.stream).toString().toLowerCase();

                return {
                    id: `${sheet.name}-${index}`, // Temp ID
                    mainSubject,
                    subject,
                    chapter,
                    question,
                    options,
                    correctAnswer,
                    class: rowClass,
                    board: rowBoard,
                    stream: rowStream,
                    isValid: question && options[0] && options[1] // Basic validation
                }
            })
            return { name: sheet.name, questions: processedQuestions }
        })

        setParsedSheets(processedSheets)
        setActiveSheet(0)
        setPreviewMode(true)
    }

    const uploadQuestionsToDB = async () => {
        // Flatten all sheets data for upload
        const allQuestions = parsedSheets.flatMap(s => s.questions)

        if (!confirm(`Ready to upload ${allQuestions.length} questions from ${parsedSheets.length} sheets?`)) return

        setUploadingQuestions(true)
        setUploadProgress('Starting upload...')
        let successCount = 0
        let failedCount = 0

        const batchSize = 450 // Firestore limit is 500 actions per batch
        const chunks = []
        for (let i = 0; i < allQuestions.length; i += batchSize) {
            chunks.push(allQuestions.slice(i, i + batchSize))
        }

        try {
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i]
                const batch = writeBatch(db)
                setUploadProgress(`Processing batch ${i + 1} of ${chunks.length}...`)

                chunk.forEach((q: any) => {
                    if (!q.isValid) {
                        failedCount++
                        return
                    }

                    try {
                        // Generate deterministic ID
                        const docId = generateQuestionId(
                            q.question,
                            q.board,
                            q.class.toString(),
                            q.subject
                        )

                        const docRef = doc(db, 'questions', docId)
                        batch.set(docRef, {
                            question: q.question,
                            options: q.options,
                            correctAnswer: q.correctAnswer,
                            subject: q.subject,
                            chapter: q.chapter,
                            board: q.board,
                            class: q.class.toString(),
                            stream: q.stream || 'Science', // New Field
                            mainSubject: q.mainSubject,
                            createdAt: Date.now(),
                            active: true
                        })
                        successCount++
                    } catch (e) {
                        console.error("Error preparing doc", e)
                        failedCount++
                    }
                })

                await batch.commit()
            }

            setUploadStats({ total: allQuestions.length, success: successCount, failed: failedCount })
            alert(`Upload Complete!\nSuccess: ${successCount}\nFailed: ${failedCount}`)
            setParsedSheets([])
            setPreviewMode(false)

        } catch (error) {
            console.error("Batch upload failed", error)
            alert("Upload failed partially. Check console.")
        } finally {
            setUploadingQuestions(false)
            setUploadProgress('')
        }
    }

    // ... (rest of authentication check)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    // ... (rest of functions) ...

    // Simple Admin Check
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-pw-surface">
                <div className="text-center p-8">
                    <FaLock className="text-4xl text-gray-400 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-700">Access Denied</h1>
                    <p className="text-gray-500">Please login to access admin area.</p>
                </div>
            </div>
        )
    }

    const handleUploadSuccess = (url: string) => {
        setFormData(prev => ({ ...prev, pdfUrl: url }))
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this note?')) return
        try {
            await deleteDoc(doc(db, 'notes', id))
            setNotes(prev => prev.filter(note => note.id !== id))
            alert('Note deleted!')
        } catch (error) {
            console.error("Error deleting note:", error)
            alert('Failed to delete note.')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.pdfUrl) {
            alert('Please upload a PDF first!')
            return
        }

        setLoading(true)
        try {
            const docRef = await addDoc(collection(db, 'notes'), {
                ...formData,
                uploadedAt: serverTimestamp(),
                downloadCount: 0
            })
            alert('Note uploaded successfully!')

            // Add to local list immediately
            setNotes(prev => [{ id: docRef.id, ...formData, uploadedAt: new Date() }, ...prev])

            setFormData({
                title: '',
                subject: 'physics',
                chapter: '',
                class: '10',
                board: 'CBSE',
                pdfUrl: '',
            })
        } catch (error) {
            console.error('Error saving note:', error)
            alert('Failed to save note.')
        } finally {
            setLoading(false)
        }
    }

    // Derived state for view
    const parsedQuestions = parsedSheets[activeSheet]?.questions || []

    const deleteSubjectQuestions = async () => {
        const subjectToDelete = 'mathematics'; // Target
        if (!confirm(`DANGER: Are you sure you want to PERMANENTLY DELETE ALL questions for '${subjectToDelete}'? This cannot be undone.`)) return;

        const confirmText = prompt(`Type "DELETE ${subjectToDelete.toUpperCase()}" to confirm:`);
        if (confirmText !== `DELETE ${subjectToDelete.toUpperCase()}`) {
            alert("Deletion cancelled. Text did not match.");
            return;
        }

        setLoading(true);
        try {
            // query for both 'mathematics' and 'maths' just in case
            const subjects = ['mathematics', 'maths'];
            let totalDeleted = 0;

            for (const subj of subjects) {
                const q = query(collection(db, 'questions'), where('subject', '==', subj));
                const snapshot = await getDocs(q);

                if (snapshot.empty) continue;

                const batch = writeBatch(db);
                snapshot.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                totalDeleted += snapshot.size;
            }

            alert(`Successfully deleted ${totalDeleted} questions via batch operation.`);
            window.location.reload(); // Refresh to clear any local state/caches
        } catch (error) {
            console.error("Error deleting subject data:", error);
            alert("Failed to delete data. Check console.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-pw-surface pb-20">
            <Header />

            <div className="pt-24 px-4 max-w-2xl mx-auto">
                {/* Tabs */}
                {/* ... existing tab buttons ... */}
                <div className="bg-white p-2 rounded-2xl shadow-pw-sm border border-pw-border flex mb-8">
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'notes' ? 'bg-pw-indigo text-white shadow-md' : 'text-gray-500 hover:text-pw-indigo'}`}
                    >
                        Notes Upload
                    </button>
                    <button
                        onClick={() => setActiveTab('questions')}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'questions' ? 'bg-pw-indigo text-white shadow-md' : 'text-gray-500 hover:text-pw-indigo'}`}
                    >
                        Questions (Bulk)
                    </button>
                </div>

                {/* DANGER ZONE - Added for subject deletion */}
                <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl">
                    <h3 className="text-red-700 font-bold mb-2 flex items-center gap-2">
                        <FaExclamationTriangle /> Danger Zone
                    </h3>
                    <p className="text-xs text-red-600 mb-4">
                        Use this to permanently remove a subject's data from the database.
                    </p>
                    <button
                        onClick={deleteSubjectQuestions}
                        className="w-full py-2 bg-red-100 text-red-700 rounded-lg font-bold text-sm hover:bg-red-200 transition-colors border border-red-200"
                    >
                        Delete All "Mathematics" Data
                    </button>
                </div>

                {activeTab === 'notes' ? (
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl p-8 shadow-pw-md border border-pw-border"
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-pw-indigo flex items-center justify-center text-white text-xl">
                                    <FaBook />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-pw-violet">Upload Study Notes</h1>
                                    <p className="text-gray-500">Add new PDFs to the app</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="e.g. Chapter 1: Light Reflection"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 transition-all outline-none"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                                        <select
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 transition-all outline-none bg-white"
                                        >
                                            <option value="physics">Physics</option>
                                            <option value="chemistry">Chemistry</option>
                                            <option value="biology">Biology</option>
                                            <option value="mathematics">Mathematics</option>
                                            <option value="history">History</option>
                                            <option value="geography">Geography</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Class</label>
                                        <select
                                            name="class"
                                            value={formData.class}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 transition-all outline-none bg-white"
                                        >
                                            <option value="9">Class 9</option>
                                            <option value="10">Class 10</option>
                                            <option value="11">Class 11</option>
                                            <option value="12">Class 12</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Board</label>
                                        <select
                                            name="board"
                                            value={formData.board}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 transition-all outline-none bg-white"
                                        >
                                            <option value="CBSE">CBSE</option>
                                            <option value="Bihar Board">Bihar Board</option>
                                            <option value="ICSE">ICSE</option>
                                            <option value="State Board">Other State Board</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Chapter Name (Optional)</label>
                                    <input
                                        type="text"
                                        name="chapter"
                                        value={formData.chapter}
                                        onChange={handleChange}
                                        placeholder="e.g. Light"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 transition-all outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">PDF File</label>
                                    <MediaUploader onUploadSuccess={handleUploadSuccess} />
                                    {formData.pdfUrl && (
                                        <p className="text-xs text-green-600 mt-2 font-medium break-all">
                                            Linked: {formData.pdfUrl}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !formData.pdfUrl}
                                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2
                                        ${loading || !formData.pdfUrl ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-pw-indigo to-pw-violet hover:shadow-pw-indigo/30'}`}
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <FaSave /> Publish Note
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>

                        {/* Manage Existing Notes */}
                        <div className="mt-12 mb-8">
                            <h2 className="text-xl font-bold text-pw-violet mb-4">Manage Uploaded Notes</h2>
                            <div className="bg-white rounded-3xl p-6 shadow-pw-sm border border-pw-border">
                                {/* List Header */}
                                <div className="grid grid-cols-12 gap-4 border-b border-gray-100 pb-4 mb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    <div className="col-span-1">#</div>
                                    <div className="col-span-4">Title</div>
                                    <div className="col-span-2">Class</div>
                                    <div className="col-span-2">Board</div>
                                    <div className="col-span-2">Subject</div>
                                    <div className="col-span-1 text-right">Action</div>
                                </div>

                                {/* List Items */}
                                {notes.length === 0 ? (
                                    <p className="text-center text-gray-400 py-8">No notes found. Upload one above!</p>
                                ) : (
                                    <div className="space-y-2">
                                        {notes.map((note, index) => (
                                            <div key={note.id} className="grid grid-cols-12 gap-4 items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                                                <div className="col-span-1 text-gray-400 font-mono text-xs">{index + 1}</div>
                                                <div className="col-span-4 font-bold text-gray-700 truncate" title={note.title}>{note.title}</div>
                                                <div className="col-span-2 text-sm text-gray-500">Class {note.class}</div>
                                                <div className="col-span-2 text-sm text-gray-500">{note.board || 'CBSE'}</div>
                                                <div className="col-span-2 text-sm text-gray-500 capitalize">{note.subject}</div>
                                                <div className="col-span-1 text-right">
                                                    <button
                                                        onClick={() => handleDelete(note.id)}
                                                        className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete Note"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    /* Questions Upload Tab */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-8 shadow-pw-md border border-pw-border"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-pw-indigo flex items-center justify-center text-white text-xl">
                                <FaQuestionCircle />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-pw-violet">Bulk Question Upload</h1>
                                <p className="text-gray-500">Upload Excel/CSV file to add questions</p>
                            </div>
                        </div>

                        {/* Global Metadata Selectors */}
                        <div className="grid grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Class</label>
                                <select
                                    value={globalSettings.class}
                                    onChange={(e) => setGlobalSettings({ ...globalSettings, class: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-gray-200 text-sm font-semibold focus:border-pw-indigo outline-none"
                                >
                                    <option value="9">Class 9</option>
                                    <option value="10">Class 10</option>
                                    <option value="11">Class 11</option>
                                    <option value="12">Class 12</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Board</label>
                                <select
                                    value={globalSettings.board}
                                    onChange={(e) => setGlobalSettings({ ...globalSettings, board: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-gray-200 text-sm font-semibold focus:border-pw-indigo outline-none"
                                >
                                    <option value="CBSE">CBSE</option>
                                    <option value="Bihar Board">Bihar Board</option>
                                    <option value="ICSE">ICSE</option>
                                    <option value="State Board">State Board</option>
                                </select>
                            </div>
                            {(globalSettings.class === '11' || globalSettings.class === '12') && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Stream</label>
                                    <select
                                        value={globalSettings.stream}
                                        onChange={(e) => setGlobalSettings({ ...globalSettings, stream: e.target.value })}
                                        className="w-full p-2 rounded-lg border border-gray-200 text-sm font-semibold focus:border-pw-indigo outline-none"
                                    >
                                        <option value="Science">Science</option>
                                        <option value="Commerce">Commerce</option>
                                        <option value="Arts">Arts</option>
                                        <option value="General">General</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {!previewMode ? (
                            <div className="border-2 border-dashed border-pw-border rounded-2xl p-10 text-center hover:border-pw-indigo transition-colors bg-pw-surface cursor-pointer relative">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleQuestionFile}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <FaFileExcel className="text-4xl text-green-600 mx-auto mb-4" />
                                <h3 className="font-bold text-gray-700 text-lg">Click to Upload Excel/CSV</h3>
                                <p className="text-sm text-gray-500 mt-2">
                                    Supported columns: Main subject, Subject, Chapter, Question, Option A-D, Correct Answer
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Sheet Tabs */}
                                {parsedSheets.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-100 mb-4">
                                        {parsedSheets.map((sheet, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveSheet(idx)}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors
                                                    ${activeSheet === idx
                                                        ? 'bg-pw-indigo text-white shadow-sm'
                                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                            >
                                                {sheet.name} ({sheet.questions.length})
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-gray-700">
                                        Previewing Sheet: <span className="text-pw-indigo">{parsedSheets[activeSheet]?.name}</span>
                                    </h3>
                                    <div className="flex gap-4">
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider self-center">
                                            {parsedQuestions.length} Questions
                                        </div>
                                        <button
                                            onClick={() => { setPreviewMode(false); setParsedSheets([]) }}
                                            className="text-sm text-red-500 font-bold hover:underline"
                                        >
                                            Discard All
                                        </button>
                                    </div>
                                </div>

                                <div className="max-h-[500px] overflow-y-auto border border-gray-200 rounded-xl shadow-inner bg-gray-50/50">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead className="bg-gray-100 text-gray-500 font-bold sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th className="p-3 w-12 text-center">#</th>
                                                <th className="p-3 w-12 text-center">Valid</th>
                                                <th className="p-3 min-w-[300px]">Question</th>
                                                <th className="p-3 w-32">Chapter</th>
                                                <th className="p-3 w-32">Subject</th>
                                                <th className="p-3 w-24">Answer</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {parsedQuestions.map((q, idx) => (
                                                <tr key={idx} className={`group transition-colors ${!q.isValid ? 'bg-red-50/50' : 'hover:bg-blue-50/30'}`}>
                                                    <td className="p-2 text-center text-gray-400 text-xs font-mono">{idx + 1}</td>
                                                    <td className="p-2 text-center">
                                                        {q.isValid ? <FaCheckCircle className="text-green-500 mx-auto" /> : <FaExclamationTriangle className="text-red-400 mx-auto" title="Missing required fields" />}
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            value={q.question}
                                                            onChange={(e) => {
                                                                const newVal = e.target.value;
                                                                setParsedSheets(prev => {
                                                                    const sheets = [...prev];
                                                                    sheets[activeSheet].questions[idx].question = newVal;
                                                                    sheets[activeSheet].questions[idx].isValid = newVal && sheets[activeSheet].questions[idx].options[0] && sheets[activeSheet].questions[idx].options[1];
                                                                    return sheets;
                                                                });
                                                            }}
                                                            className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-pw-indigo focus:bg-white outline-none py-1 px-2 transition-all font-medium text-gray-800"
                                                            placeholder="Enter Question..."
                                                        />
                                                        {parsedSheets[activeSheet]?.questions[idx]?.question && (
                                                            <div className="flex gap-2 mt-1">
                                                                {q.options.map((opt: string, optIdx: number) => (
                                                                    <input
                                                                        key={optIdx}
                                                                        value={opt}
                                                                        onChange={(e) => {
                                                                            const newVal = e.target.value;
                                                                            setParsedSheets(prev => {
                                                                                const sheets = [...prev];
                                                                                sheets[activeSheet].questions[idx].options[optIdx] = newVal;
                                                                                // Check valid
                                                                                const qRef = sheets[activeSheet].questions[idx];
                                                                                qRef.isValid = qRef.question && qRef.options[0] && qRef.options[1];
                                                                                return sheets;
                                                                            });
                                                                        }}
                                                                        className={`w-full text-xs border rounded px-1 py-0.5 outline-none focus:border-pw-indigo ${optIdx === q.correctAnswer ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                                                        placeholder={`Opt ${String.fromCharCode(65 + optIdx)}`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            value={q.chapter}
                                                            onChange={(e) => {
                                                                const newVal = e.target.value;
                                                                setParsedSheets(prev => {
                                                                    const sheets = [...prev];
                                                                    sheets[activeSheet].questions[idx].chapter = newVal;
                                                                    return sheets;
                                                                });
                                                            }}
                                                            className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-pw-indigo outline-none py-1 px-1 text-xs text-gray-600 focus:text-gray-900"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <select
                                                            value={q.subject}
                                                            onChange={(e) => {
                                                                const newVal = e.target.value;
                                                                setParsedSheets(prev => {
                                                                    const sheets = [...prev];
                                                                    sheets[activeSheet].questions[idx].subject = newVal;
                                                                    return sheets;
                                                                });
                                                            }}
                                                            className="w-full bg-transparent text-xs py-1 outline-none cursor-pointer hover:text-pw-indigo"
                                                        >
                                                            {['physics', 'chemistry', 'biology', 'history', 'geography', 'civics', 'economics', 'english', 'hindi'].map(s => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="p-2">
                                                        <select
                                                            value={q.correctAnswer}
                                                            onChange={(e) => {
                                                                const newVal = parseInt(e.target.value);
                                                                setParsedSheets(prev => {
                                                                    const sheets = [...prev];
                                                                    sheets[activeSheet].questions[idx].correctAnswer = newVal;
                                                                    return sheets;
                                                                });
                                                            }}
                                                            className="bg-transparent font-mono font-bold text-center w-full outline-none focus:text-pw-indigo cursor-pointer"
                                                        >
                                                            <option value={0}>A</option>
                                                            <option value={1}>B</option>
                                                            <option value={2}>C</option>
                                                            <option value={3}>D</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {uploadProgress && (
                                    <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-center font-bold text-sm animate-pulse border border-blue-100 flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        {uploadProgress}
                                    </div>
                                )}

                                {uploadStats.total > 0 && (
                                    <div className="bg-green-50 text-green-700 p-4 rounded-xl text-center border border-green-100">
                                        <p className="font-bold text-lg mb-1">🎉 Upload Complete!</p>
                                        <p className="text-sm opacity-80">Successfully uploaded {uploadStats.success} questions across all sheets.</p>
                                        {uploadStats.failed > 0 && <p className="text-xs text-red-500 mt-2 font-bold">{uploadStats.failed} questions failed (check missing fields).</p>}
                                    </div>
                                )}

                                {!uploadingQuestions && uploadStats.total === 0 && (
                                    <div className="flex gap-4">
                                        <button
                                            onClick={uploadQuestionsToDB}
                                            className="flex-1 py-4 bg-gradient-to-r from-pw-indigo to-pw-violet text-white rounded-xl font-bold shadow-lg shadow-pw-indigo/20 hover:shadow-pw-indigo/40 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                                        >
                                            <FaSave className="group-hover:scale-110 transition-transform" />
                                            Upload All Sheets ({parsedSheets.reduce((acc, s) => acc + s.questions.filter(q => q.isValid).length, 0)} Questions)
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    )
}

export default UploadPage
