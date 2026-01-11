'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/shared/Header'
import { MediaUploader } from '@/components/admin/MediaUploader'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, deleteDoc, doc, writeBatch, where, getDoc, setDoc, getCountFromServer } from 'firebase/firestore'
import { FaBook, FaSave, FaLock, FaTrash, FaQuestionCircle, FaFileExcel, FaCheckCircle, FaExclamationTriangle, FaChevronDown, FaChevronUp, FaEye, FaEdit, FaDownload, FaBell, FaGamepad, FaVideo, FaCog, FaUpload } from 'react-icons/fa'
import { useAuth } from '@/hooks/useAuth'
import * as XLSX from 'xlsx'
import { generateQuestionId } from '@/utils/idGenerator'
import Link from 'next/link'

const UploadPage = () => {
    const { user } = useAuth()

    const [activeTab, setActiveTab] = useState<'notes' | 'questions'>('notes')
    const [loading, setLoading] = useState(false)

    // Notes Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',       // NEW
        subject: 'physics',
        chapter: '',
        class: '10',
        board: 'CBSE',
        difficulty: 'medium',  // NEW
        tags: '',              // NEW
        pdfUrl: '',
    })

    // Global Metadata State (for Bulk Upload)
    const [globalSettings, setGlobalSettings] = useState({
        class: 'all',  // Default to Auto Detect
        board: 'all',  // Default to Auto Detect
        stream: 'all'  // Default to Auto Detect
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

    // Stats State
    const [totalQuestions, setTotalQuestions] = useState(0)
    const [showDangerZone, setShowDangerZone] = useState(false)
    const [selectedNote, setSelectedNote] = useState<any | null>(null)

    // Fetch Notes and Stats on Load
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch notes
                const notesQuery = query(collection(db, 'notes'), orderBy('uploadedAt', 'desc'))
                const notesSnapshot = await getDocs(notesQuery)
                setNotes(notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))

                // Fetch question count
                const questionsCol = collection(db, 'questions')
                const countSnapshot = await getCountFromServer(questionsCol)
                setTotalQuestions(countSnapshot.data().count)
            } catch (error) {
                console.error("Error fetching data:", error)
            }
        }
        fetchData()
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
                // Improved: Check against explicit list of common headers first
                const explicitSubjectKeys = ['subject', 'sub', 'subject name', 'subjects', 'subject_name', 'course'];
                let subjectKey = keys.find(k => explicitSubjectKeys.includes(normalize(k)));

                if (!subjectKey) {
                    // Fallback: Contains 'subject' but NOT 'main' (to avoid Main Subject overlap)
                    // Also robustly check for 'sub' if it stands alone or is a prefix
                    subjectKey = keys.find(k => {
                        const norm = normalize(k);
                        return (norm.includes('subject') && !norm.includes('main')) || norm === 'sub';
                    });
                }
                const subjectRaw = subjectKey ? row[subjectKey] : 'general';
                const subject = String(subjectRaw).toLowerCase();

                // For Chapter: Look for "chapter", "topic", "unit", "lesson"
                // For Chapter: Robust check (contains any of these keywords)
                const chapterKey = keys.find(k =>
                    ['chapter', 'topic', 'unit', 'lesson', 'chap'].some(keyword => normalize(k).includes(keyword))
                );
                const chapter = chapterKey ? row[chapterKey] : 'General';

                const questionKey = findKeySmart(['question', 'question text', 'q', 'questions', 'qs', 'problem'], 'question');
                const question = questionKey ? row[questionKey] : '';

                // Options - Force string conversion for numbers (e.g. 2024, 0)
                // IMPROVED: Prioritize exact match for "Option A", "Option B", etc.
                const findOptionKey = (letter: string) => {
                    const candidates = [`option ${letter}`, `opt ${letter}`, `(${letter})`, `${letter})`];
                    // First: Exact match
                    let key = keys.find(k => candidates.includes(normalize(k)));
                    // Second: Loose match (contains "option" and the letter)
                    if (!key) {
                        key = keys.find(k => normalize(k).includes('option') && normalize(k).includes(letter));
                    }
                    // Third: Just the letter (e.g., column named "A", "B")
                    if (!key) {
                        key = keys.find(k => normalize(k) === letter);
                    }
                    return key;
                };

                const options = [
                    findOptionKey('a') ? String(row[findOptionKey('a')!] ?? '') : '',
                    findOptionKey('b') ? String(row[findOptionKey('b')!] ?? '') : '',
                    findOptionKey('c') ? String(row[findOptionKey('c')!] ?? '') : '',
                    findOptionKey('d') ? String(row[findOptionKey('d')!] ?? '') : ''
                ];

                // Correct Answer Logic
                let correctAnswer = 0; // Default to A

                const ansKey = findKeySmart(['correct answer', 'correct', 'answer', 'ans', 'correct_option']);
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
                const classKey = findKeySmart(['class', 'grade', 'standard', 'cls', 'std']);
                const rowClass = classKey ? row[classKey].toString() : globalSettings.class;

                const boardKey = findKeySmart(['board', 'brd']);
                const rowBoard = (boardKey ? row[boardKey] : globalSettings.board).toString().toLowerCase();

                const streamKey = findKeySmart(['stream', 'str']);
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

        // DEBUG: Log first parsed question
        if (processedSheets.length > 0 && processedSheets[0].questions.length > 0) {
            console.log("=== PARSED DATA DEBUG ===");
            console.log("First Question:", processedSheets[0].questions[0]);
            console.log("Total Sheets:", processedSheets.length);
            console.log("Total Questions:", processedSheets.reduce((sum, s) => sum + s.questions.length, 0));
        }

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
        console.log("=== UPLOAD STARTED ===");
        console.log("Total questions to upload:", allQuestions.length);
        console.log("Valid questions:", allQuestions.filter(q => q.isValid).length);
        console.log("Invalid questions:", allQuestions.filter(q => !q.isValid).length);
        let successCount = 0
        let failedCount = 0
        const failedItems: any[] = [] // Track failed items
        let globalQuestionIndex = 0; // COUNTER FOR UNIQUE IDs

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

                chunk.forEach((q: any, chunkIndex: number) => {
                    if (!q.isValid) {
                        failedCount++
                        failedItems.push({ error: "Invalid Data (Missing Q/Opt)", ...q })
                        return
                    }

                    // ENFORCE Global Settings if set (User Request: "jis class, board ko slect kru... wahi upload ho")
                    // If global settings are NOT 'all' or default, we prioritize them over the row data
                    // actually processParsedData already did this fallback, but let's be strict if the user changed the dropdowns AFTER parsing.
                    const finalBoard = (globalSettings.board && globalSettings.board !== 'all')
                        ? globalSettings.board.toLowerCase()
                        : q.board;

                    const finalClass = (globalSettings.class && globalSettings.class !== 'all')
                        ? globalSettings.class.toString()
                        : q.class.toString();

                    const finalStream = (globalSettings.stream && globalSettings.stream !== 'all')
                        ? globalSettings.stream.toLowerCase()
                        : (q.stream || 'science');

                    try {
                        // Generate TRULY UNIQUE ID using global counter + random
                        // This GUARANTEES no collision even if question text is identical
                        globalQuestionIndex++;
                        const uniqueSuffix = `${Date.now().toString(36)}${globalQuestionIndex.toString().padStart(6, '0')}${Math.random().toString(36).substr(2, 4)}`;
                        const baseId = generateQuestionId(
                            q.question,
                            finalBoard,
                            finalClass,
                            q.subject
                        );
                        const docId = `${baseId}_${uniqueSuffix}`;

                        const docRef = doc(db, 'questions', docId)
                        batch.set(docRef, {
                            question: q.question,
                            options: q.options,
                            correctAnswer: q.correctAnswer,
                            subject: q.subject,
                            chapter: q.chapter,
                            board: finalBoard,
                            class: finalClass,
                            stream: finalStream,
                            mainSubject: q.mainSubject,
                            createdAt: Date.now(),
                            active: true
                        })

                        // Update the 'q' object in place so the Metadata update logic below uses the CORRECT enforced values
                        q.board = finalBoard;
                        q.class = finalClass;
                        // q.stream = finalStream; // Stream not used in metadata yet but good to be consistent

                        successCount++
                    } catch (e: any) {
                        console.error("Error preparing doc", e)
                        failedCount++
                        failedItems.push({ error: e.message || "ID Gen/Batch Error", ...q })
                    }
                })

                await batch.commit()
                console.log(`Batch ${i + 1} committed successfully. Running total: ${successCount} success, ${failedCount} failed`);
            }

            // NEW: Update Metadata for New Chapters
            setUploadProgress('Updating App Menu (Metadata)...');
            const metaDocRef = doc(db, 'metadata', 'taxonomy');
            const metaSnap = await getDoc(metaDocRef);
            let metaData = metaSnap.exists() ? metaSnap.data() : {};
            let metaModified = false;

            // Group uploaded questions by Board_Class -> Subject
            allQuestions.forEach(q => {
                if (q.isValid) {
                    const key = `${q.board.toLowerCase()}_${q.class}`;
                    const subject = q.subject.toLowerCase();
                    const chapter = q.chapter;

                    // Ensure keys exist
                    if (!metaData[key]) {
                        metaData[key] = { subjects: [], chapters: {} };
                        metaModified = true;
                    }
                    if (!metaData[key].subjects.includes(subject)) {
                        metaData[key].subjects.push(subject);
                        metaModified = true;
                    }
                    if (!metaData[key].chapters) {
                        metaData[key].chapters = {};
                        metaModified = true;
                    }
                    if (!metaData[key].chapters[subject]) {
                        metaData[key].chapters[subject] = [];
                        metaModified = true;
                    }

                    // Add Chapter if unique
                    const existingChapters = metaData[key].chapters[subject].map((c: any) => typeof c === 'string' ? c : c.name);
                    if (!existingChapters.includes(chapter)) {
                        // FIX: Store as object to match existing schema AND app expectations
                        metaData[key].chapters[subject].push({ name: chapter, count: 1 });
                        metaModified = true;
                    }
                }
            });

            if (metaModified) {
                await setDoc(metaDocRef, metaData);
            }

            setUploadStats({ total: allQuestions.length, success: successCount, failed: failedCount })

            if (failedCount > 0) {
                // Generate simple error report
                const errorReport = failedItems.map((f, idx) => `${idx + 1}. [${f.error}] Q: ${f.question?.substring(0, 30)}... (Row: ${f.id})`).join('\n');
                alert(`Upload Partial Success!\nSuccess: ${successCount}\nFailed: ${failedCount}\n\nFailures (Check Console for more):\n${errorReport.substring(0, 1000)}${errorReport.length > 1000 ? '...' : ''}`)
                console.log("Failed Items Detail:", failedItems);
            } else {
                alert(`Upload Complete! All ${successCount} questions uploaded successfully.`)
            }

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
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
                title: formData.title,
                description: formData.description || '',
                subject: formData.subject,
                chapter: formData.chapter,
                class: formData.class,
                board: formData.board,
                difficulty: formData.difficulty || 'medium',
                tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                pdfUrl: formData.pdfUrl,
                uploadedAt: serverTimestamp(),
                downloadCount: 0,
                type: 'pdf'
            })
            alert('Note uploaded successfully!')

            // Add to local list immediately
            setNotes(prev => [{
                id: docRef.id,
                title: formData.title,
                description: formData.description || '',
                subject: formData.subject,
                chapter: formData.chapter,
                class: formData.class,
                board: formData.board,
                difficulty: formData.difficulty || 'medium',
                tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                pdfUrl: formData.pdfUrl,
                downloadCount: 0,
                uploadedAt: new Date()
            }, ...prev])

            setFormData({
                title: '',
                description: '',        // NEW
                subject: 'physics',
                chapter: '',
                class: '10',
                board: 'CBSE',
                difficulty: 'medium',   // NEW
                tags: '',               // NEW
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


    // NEW: Clean Metadata (Taxonomy)
    const sanitizeMetadata = async () => {
        if (!confirm("Are you sure you want to remove 'Mathematics' from the APP MENU (Metadata)?")) return;
        setLoading(true);
        try {
            const docRef = doc(db, 'metadata', 'taxonomy');
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                alert("Metadata not found!");
                return;
            }

            const data = docSnap.data();
            let modified = false;

            // Iterate over all keys (e.g., cbse_10, icse_9)
            Object.keys(data).forEach(key => {
                const entry = data[key];
                if (entry && entry.subjects) {
                    // Filter out math
                    const newSubjects = entry.subjects.filter((s: string) => s !== 'mathematics' && s !== 'maths');
                    if (newSubjects.length !== entry.subjects.length) {
                        entry.subjects = newSubjects;
                        modified = true;
                    }
                }
                if (entry && entry.chapters) {
                    if (entry.chapters['mathematics']) {
                        delete entry.chapters['mathematics'];
                        modified = true;
                    }
                    if (entry.chapters['maths']) {
                        delete entry.chapters['maths'];
                        modified = true;
                    }
                }
            });

            if (modified) {
                await setDoc(docRef, data); // Overwrite with cleaned data
                alert("Metadata cleaned! 'Mathematics' should be gone from the app menu now.");
            } else {
                alert("No 'Mathematics' found in metadata.");
            }

        } catch (e) {
            console.error("Error cleaning metadata", e);
            alert("Failed to clean metadata");
        } finally {
            setLoading(false);
        }
    }

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

            <div className="pt-24 px-4 max-w-4xl mx-auto">
                {/* Enhanced Page Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-pw-violet">Admin Upload Center</h1>
                            <p className="text-gray-500 text-sm">Manage notes, questions, and app content</p>
                        </div>
                        <div className="hidden md:flex items-center gap-3">
                            <div className="text-center px-4 py-2 bg-white rounded-xl border border-pw-border shadow-sm">
                                <p className="text-2xl font-bold text-pw-indigo">{totalQuestions.toLocaleString()}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Questions</p>
                            </div>
                            <div className="text-center px-4 py-2 bg-white rounded-xl border border-pw-border shadow-sm">
                                <p className="text-2xl font-bold text-emerald-500">{notes.length}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Notes</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
                        <Link href="/admin/questions" className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-pw-border hover:border-pw-indigo hover:shadow-md transition-all text-sm font-medium text-gray-600 hover:text-pw-indigo">
                            <FaQuestionCircle className="text-blue-500" /> Questions
                        </Link>
                        <Link href="/admin/live-quizzes" className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-pw-border hover:border-pw-indigo hover:shadow-md transition-all text-sm font-medium text-gray-600 hover:text-pw-indigo">
                            <FaGamepad className="text-pink-500" /> Live Quiz
                        </Link>
                        <Link href="/admin/study-hub" className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-pw-border hover:border-pw-indigo hover:shadow-md transition-all text-sm font-medium text-gray-600 hover:text-pw-indigo">
                            <FaVideo className="text-red-500" /> Videos
                        </Link>
                        <Link href="/admin/notifications" className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-pw-border hover:border-pw-indigo hover:shadow-md transition-all text-sm font-medium text-gray-600 hover:text-pw-indigo">
                            <FaBell className="text-yellow-500" /> Notify
                        </Link>
                        <Link href="/admin" className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-pw-border hover:border-pw-indigo hover:shadow-md transition-all text-sm font-medium text-gray-600 hover:text-pw-indigo">
                            <FaCog className="text-gray-500" /> Dashboard
                        </Link>
                    </div>
                </div>

                {/* Enhanced Tabs */}
                <div className="bg-white p-2 rounded-2xl shadow-pw-sm border border-pw-border flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'notes' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md' : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                    >
                        <FaBook /> Notes ({notes.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('questions')}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'questions' ? 'bg-gradient-to-r from-pw-indigo to-pw-violet text-white shadow-md' : 'text-gray-500 hover:text-pw-indigo hover:bg-pw-indigo/10'}`}
                    >
                        <FaQuestionCircle /> Questions (Bulk)
                    </button>
                </div>

                {/* Collapsible DANGER ZONE */}
                <div className="mb-6">
                    <button
                        onClick={() => setShowDangerZone(!showDangerZone)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-bold text-sm hover:bg-red-100 transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <FaExclamationTriangle /> Danger Zone (Advanced)
                        </span>
                        {showDangerZone ? <FaChevronUp /> : <FaChevronDown />}
                    </button>

                    <AnimatePresence>
                        {showDangerZone && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 bg-red-50 border border-t-0 border-red-200 rounded-b-xl space-y-3">
                                    <p className="text-xs text-red-600">
                                        ⚠️ These actions permanently delete data. Use with caution.
                                    </p>
                                    <button
                                        onClick={deleteSubjectQuestions}
                                        className="w-full py-2 bg-red-100 text-red-700 rounded-lg font-bold text-sm hover:bg-red-200 transition-colors border border-red-200"
                                    >
                                        Delete All "Mathematics" Questions
                                    </button>
                                    <button
                                        onClick={sanitizeMetadata}
                                        className="w-full py-2 bg-orange-100 text-orange-700 rounded-lg font-bold text-sm hover:bg-orange-200 transition-colors border border-orange-200"
                                    >
                                        Clean App Menu (Remove Subject)
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
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

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Brief summary of the notes..."
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 transition-all outline-none resize-none"
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
                                            <option value="hindi">Hindi</option>
                                            <option value="english">English</option>
                                            <option value="sanskrit">Sanskrit</option>
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
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Board</label>
                                        <select
                                            name="board"
                                            value={formData.board}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 transition-all outline-none bg-white"
                                        >
                                            <option value="cbse">CBSE</option>
                                            <option value="bseb">Bihar Board</option>
                                            <option value="icse">ICSE</option>
                                            <option value="up">UP Board</option>
                                            <option value="other">Other State Board</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty</label>
                                        <select
                                            name="difficulty"
                                            value={formData.difficulty}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 transition-all outline-none bg-white font-medium"
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
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
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Tags (comma separated)</label>
                                        <input
                                            type="text"
                                            name="tags"
                                            value={formData.tags}
                                            onChange={handleChange}
                                            placeholder="e.g. exam-special, formula, pyq"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 transition-all outline-none"
                                        />
                                    </div>
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
                            <div className="bg-white rounded-3xl p-4 md:p-6 shadow-pw-sm border border-pw-border">
                                {/* List Items */}
                                {notes.length === 0 ? (
                                    <p className="text-center text-gray-400 py-8">No notes found. Upload one above!</p>
                                ) : (
                                    <div className="space-y-3">
                                        {notes.map((note, index) => (
                                            <motion.div
                                                key={note.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all group border border-gray-100"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-mono text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">{index + 1}</span>
                                                        <h3 className="font-bold text-gray-800 truncate">{note.title}</h3>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold capitalize">{note.subject}</span>
                                                        <span>Class {note.class}</span>
                                                        <span className="text-gray-300">•</span>
                                                        <span>{note.board || 'CBSE'}</span>
                                                        {note.downloadCount > 0 && (
                                                            <>
                                                                <span className="text-gray-300">•</span>
                                                                <span className="flex items-center gap-1">
                                                                    <FaDownload className="text-gray-400" /> {note.downloadCount}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-3 sm:mt-0">
                                                    <button
                                                        onClick={() => setSelectedNote(note)}
                                                        className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-pw-indigo bg-pw-indigo/10 hover:bg-pw-indigo hover:text-white rounded-lg transition-all"
                                                    >
                                                        <FaEye /> View
                                                    </button>
                                                    <a
                                                        href={note.pdfUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-emerald-600 bg-emerald-100 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                                                    >
                                                        <FaDownload /> PDF
                                                    </a>
                                                    <button
                                                        onClick={() => handleDelete(note.id)}
                                                        className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all"
                                                        title="Delete Note"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </motion.div>
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
                                    <option value="all">Auto Detect (File)</option>
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
                                    <option value="all">Auto Detect (File)</option>
                                    <option value="cbse">CBSE</option>
                                    <option value="bseb">BSEB (Bihar)</option>
                                    <option value="icse">ICSE</option>
                                    <option value="up">UP Board</option>
                                    <option value="other">Other State Board</option>
                                </select>
                            </div>
                            {/* Always show Stream selector but maybe disabled if class < 11? Or just show for all for flexibility */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Stream</label>
                                <select
                                    value={globalSettings.stream}
                                    onChange={(e) => setGlobalSettings({ ...globalSettings, stream: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-gray-200 text-sm font-semibold focus:border-pw-indigo outline-none"
                                >
                                    <option value="all">Auto Detect (File)</option>
                                    <option value="Science">Science</option>
                                    <option value="Commerce">Commerce</option>
                                    <option value="Arts">Arts</option>
                                    <option value="General">General</option>
                                </select>
                            </div>
                        </div>

                        {!previewMode ? (
                            <div className="mb-8">
                                <div className="relative h-64 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center group hover:border-pw-indigo hover:bg-pw-indigo/5 transition-all">
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

                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const templateData = [
                                                {
                                                    "Main subject": "Science",
                                                    "Subject": "Physics",
                                                    "Chapter": "Light Reflection",
                                                    "Question": "What is the speed of light?",
                                                    "Option A": "3x10^8 m/s",
                                                    "Option B": "300 km/s",
                                                    "Option C": "Sound speed",
                                                    "Option D": "Infinite",
                                                    "Correct Answer": "a"
                                                }
                                            ];
                                            const ws = XLSX.utils.json_to_sheet(templateData);
                                            const wb = XLSX.utils.book_new();
                                            XLSX.utils.book_append_sheet(wb, ws, "Template");
                                            XLSX.writeFile(wb, "question_upload_template.xlsx");
                                        }}
                                        className="text-pw-indigo font-bold hover:underline text-sm flex items-center justify-center gap-2"
                                    >
                                        <FaDownload /> Download Sample Template
                                    </button>
                                </div>
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

                                {/* Subject Summary Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                                    {Object.entries(
                                        parsedQuestions.reduce((acc: any, q) => {
                                            const sub = q.subject || 'Unknown';
                                            acc[sub] = (acc[sub] || 0) + 1;
                                            return acc;
                                        }, {})
                                    ).map(([subject, count]: any) => (
                                        <div key={subject} className="bg-white border border-gray-200 p-3 rounded-xl flex justify-between items-center shadow-sm">
                                            <span className="capitalize font-bold text-gray-600 text-sm">{subject}</span>
                                            <span className="bg-pw-indigo/10 text-pw-indigo px-2 py-1 rounded-lg text-xs font-bold">{count} Qs</span>
                                        </div>
                                    ))}
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
                                                        <input
                                                            value={q.subject}
                                                            onChange={(e) => {
                                                                const newVal = e.target.value;
                                                                setParsedSheets(prev => {
                                                                    const sheets = [...prev];
                                                                    sheets[activeSheet].questions[idx].subject = newVal;
                                                                    return sheets;
                                                                });
                                                            }}
                                                            className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-pw-indigo outline-none py-1 px-1 text-xs text-gray-600 focus:text-gray-900 capitalize"
                                                            placeholder="Subject"
                                                        />
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

            {/* PDF Viewer Modal */}
            <AnimatePresence>
                {selectedNote && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setSelectedNote(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{selectedNote.title}</h3>
                                    <p className="text-xs text-gray-500 capitalize">{selectedNote.subject} • {selectedNote.board || 'CBSE'} • Class {selectedNote.class}</p>
                                </div>
                                <div className="flex gap-2">
                                    <a
                                        href={selectedNote.pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-pw-indigo text-white text-sm font-bold rounded-lg hover:bg-pw-violet transition-colors flex items-center gap-2"
                                    >
                                        <FaDownload /> Download
                                    </a>
                                    <button
                                        onClick={() => setSelectedNote(null)}
                                        className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 text-xl"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* Viewer */}
                            <div className="flex-1 bg-gray-100 relative">
                                {selectedNote.pdfUrl.includes('/raw/upload/') ? (
                                    <iframe
                                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedNote.pdfUrl)}&embedded=true`}
                                        className="w-full h-full border-0"
                                        title={selectedNote.title}
                                    />
                                ) : (
                                    <object
                                        data={selectedNote.pdfUrl}
                                        type="application/pdf"
                                        className="w-full h-full"
                                    >
                                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                            <p className="text-gray-500 font-medium mb-2">Unable to display PDF.</p>
                                            <a
                                                href={selectedNote.pdfUrl}
                                                className="text-pw-indigo font-bold hover:underline"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Open in New Tab
                                            </a>
                                        </div>
                                    </object>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    )
}

export default UploadPage
