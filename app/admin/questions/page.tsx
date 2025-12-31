'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    getDocs,
    getDoc,
    doc,
    deleteDoc,
    updateDoc,
    addDoc,
    setDoc,
    serverTimestamp,
    DocumentData,
    QueryDocumentSnapshot
} from 'firebase/firestore'
import { HiFilter, HiSearch, HiPencil, HiTrash, HiChevronDown, HiPlus, HiArrowLeft } from 'react-icons/hi'
import Link from 'next/link'
import EditQuestionModal from '@/components/admin/EditQuestionModal'
import ManageChaptersModal from '@/components/admin/ManageChaptersModal'
import { Board, Class } from '@/data/types'

import { Question as DomainQuestion } from '@/data/types'
import { generateQuestionId } from '@/utils/idGenerator'

const PAGE_SIZE = 20

// Extend Domain Question with Firestore specific fields
interface Question extends DomainQuestion {
    createdAt: number
}

export default function QuestionsPage() {
    const [questions, setQuestions] = useState<Question[]>([])
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)

    // Filters
    const [filterBoard, setFilterBoard] = useState<Board | 'all'>('all')
    const [filterClass, setFilterClass] = useState<Class | 'all'>('all')
    const [filterSubject, setFilterSubject] = useState('')
    const [filterChapter, setFilterChapter] = useState('')

    // Edit Modal
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isManageChaptersOpen, setIsManageChaptersOpen] = useState(false)

    const fetchQuestions = async (isNew = false) => {
        setLoading(true)
        try {
            const constraints: any[] = [limit(PAGE_SIZE)]

            // Apply Filters
            // Note: If we use 'where' filters, we CANNOT easily sort by 'createdAt' without a composite index.
            // To avoid errors for the user without them creating indexes manually, we only sort if NO filters are active.
            let hasFilters = false;

            if (filterBoard !== 'all') { constraints.push(where('board', '==', filterBoard)); hasFilters = true; }
            if (filterClass !== 'all') { constraints.push(where('class', '==', filterClass)); hasFilters = true; }
            if (filterSubject) { constraints.push(where('subject', '==', filterSubject.toLowerCase())); hasFilters = true; }
            if (filterChapter) { constraints.push(where('chapter', '==', filterChapter)); hasFilters = true; }

            // Only sort by creation date if we are just browsing (no filters)
            // Or if you eventually add indexes, you can uncomment this.
            if (!hasFilters) {
                constraints.unshift(orderBy('createdAt', 'desc'))
            }

            if (!isNew && lastDoc) {
                constraints.push(startAfter(lastDoc))
            }

            const q = query(collection(db, 'questions'), ...constraints)
            const snapshot = await getDocs(q)

            if (snapshot.empty) {
                setHasMore(false)
                if (isNew) {
                    setQuestions([])
                }
            } else {
                setLastDoc(snapshot.docs[snapshot.docs.length - 1])
                const newQuestions = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Question))

                if (isNew) {
                    setQuestions(newQuestions)
                } else {
                    setQuestions(prev => [...prev, ...newQuestions])
                }
            }
        } catch (error) {
            console.error("Error fetching questions:", error)
            // Fallback for missing index error - simplified query
            if (isNew) setQuestions([])
            alert("Error fetching (Check Console - likely missing index)")
        } finally {
            setLoading(false)
        }
    }

    const [taxonomy, setTaxonomy] = useState<any>(null)
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
    const [availableChapters, setAvailableChapters] = useState<string[]>([])

    // Fetch Metadata
    const fetchMetadata = async () => {
        try {
            const docRef = doc(db, 'metadata', 'taxonomy')
            const docSnap = await getDoc(docRef)
            if (docSnap.exists()) {
                setTaxonomy(docSnap.data())
            }
        } catch (e) {
            console.error("Failed to load metadata", e)
        }
    }

    useEffect(() => {
        fetchMetadata()
    }, [])

    // Derive Dropdowns based on Filters
    useEffect(() => {
        if (!taxonomy) return

        // 1. Get Subjects
        // If Board/Class selected, get specific subjects. Else get all unique subjects.
        const subjects = new Set<string>()
        const taxKey = `${filterBoard}_${filterClass}`

        if (filterBoard !== 'all' && filterClass !== 'all' && taxonomy[taxKey]) {
            taxonomy[taxKey].subjects?.forEach((s: string) => subjects.add(s))
        } else {
            // Aggregate all
            Object.values(taxonomy).forEach((val: any) => {
                if (val.subjects) val.subjects.forEach((s: string) => subjects.add(s))
            })
        }
        setAvailableSubjects(Array.from(subjects).sort())

        // 2. Get Chapters
        // Needs Subject + (Board/Class optional but recommended for precision)
        const chapters = new Set<string>()
        if (filterSubject) {
            if (filterBoard !== 'all' && filterClass !== 'all' && taxonomy[taxKey]) {
                // Specific
                const chapList = taxonomy[taxKey].chapters?.[filterSubject]
                if (chapList) chapList.forEach((c: any) => chapters.add(c.name))
            } else {
                // Aggregate all chapters for this subject across all boards
                Object.values(taxonomy).forEach((val: any) => {
                    const chapList = val.chapters?.[filterSubject]
                    if (chapList) chapList.forEach((c: any) => chapters.add(c.name))
                })
            }
        }
        setAvailableChapters(Array.from(chapters).sort())

    }, [taxonomy, filterBoard, filterClass, filterSubject])

    // Initial Fetch & Refetch on Filter Change
    useEffect(() => {
        setLastDoc(null)
        setHasMore(true)
        fetchQuestions(true)
    }, [filterBoard, filterClass, filterSubject, filterChapter])

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this question?")) return
        try {
            await deleteDoc(doc(db, 'questions', id))
            setQuestions(prev => prev.filter(q => q.id !== id))
        } catch (error) {
            console.error("Delete failed", error)
            alert("Delete failed")
        }
    }

    const handleEdit = (question: Question) => {
        setEditingQuestion(question)
        setIsEditModalOpen(true)
    }

    const handleCreate = () => {
        // Pre-fill with current filters if selected
        const newQ: Partial<Question> = {
            options: ['', '', '', ''],
            correctAnswer: 0,
        }
        if (filterBoard !== 'all') newQ.board = filterBoard
        if (filterClass !== 'all') newQ.class = filterClass
        if (filterSubject) newQ.subject = filterSubject as any // Cast for now or import Subject type
        if (filterChapter) newQ.chapter = filterChapter

        setEditingQuestion(newQ as Question)
        setIsEditModalOpen(true)
    }

    const handleUpdate = async (id: string | undefined, data: Partial<Question>) => {
        try {
            if (id) {
                // Update existing
                const qRef = doc(db, 'questions', id)
                await updateDoc(qRef, data)
                setQuestions(prev => prev.map(q => (q.id === id ? { ...q, ...data } : q)))
            } else {
                // Create new
                // Check if duplicate
                const newId = generateQuestionId(data.question || '', data.board || 'other', data.class || 'other', data.subject || 'general')
                const docRef = doc(db, 'questions', newId)

                // Check existence
                const docSnap = await getDoc(docRef)
                if (docSnap.exists()) {
                    alert("A question with this text already exists in this category.")
                    throw new Error("Duplicate question")
                }

                const newDoc = {
                    ...data,
                    createdAt: Date.now(),
                    active: true
                }
                await setDoc(docRef, newDoc)

                // Refresh list if it matches filters
                // Simplified: just add to top if no strict sorting, or refetch
                fetchQuestions(true)
            }
            setIsEditModalOpen(false)
        } catch (error) {
            console.error("Save failed", error)
            alert("Save failed")
            throw error // Propagate to modal to stop closing
        }
    }

    return (
        <div className="min-h-screen bg-pw-surface p-8 font-sans">
            <EditQuestionModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                question={editingQuestion}
                onSave={handleUpdate}
            />

            <ManageChaptersModal
                isOpen={isManageChaptersOpen}
                onClose={() => setIsManageChaptersOpen(false)}
                onUpdate={fetchMetadata}
            />

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <Link href="/admin" className="text-gray-400 font-bold hover:text-pw-indigo flex items-center gap-1 mb-2">
                            <HiArrowLeft /> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-display font-bold text-pw-violet">Manage Questions</h1>
                        <p className="text-gray-500 font-medium">View, edit, and curate the question bank.</p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => setIsManageChaptersOpen(true)}
                            className="flex items-center gap-2 bg-white border border-pw-border text-pw-indigo shadow-pw-sm hover:shadow-pw-md px-4 py-2.5 rounded-xl font-bold transition-all hover:bg-pw-surface"
                        >
                            <HiPencil className="text-lg" /> Manage Chapters
                        </button>
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 bg-gradient-to-r from-pw-indigo to-pw-violet text-white px-6 py-2.5 rounded-xl font-bold shadow-pw-md hover:shadow-pw-lg transition-all hover:-translate-y-0.5"
                        >
                            <HiPlus className="text-lg" /> Add Question
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-[2rem] shadow-pw-md border border-pw-border mb-8 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2 text-pw-indigo font-bold uppercase text-xs tracking-wider bg-pw-indigo/10 px-3 py-1.5 rounded-lg">
                        <HiFilter className="text-lg" /> Filters
                    </div>

                    <select
                        value={filterBoard}
                        onChange={e => setFilterBoard(e.target.value as any)}
                        className="px-4 py-2.5 bg-pw-surface border border-pw-border rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 transition-all min-w-[140px]"
                    >
                        <option value="all">All Boards</option>
                        <option value="cbse">CBSE</option>
                        <option value="icse">ICSE</option>
                        <option value="bseb">BSEB</option>
                        <option value="up">UP Board</option>
                    </select>

                    <select
                        value={filterClass}
                        onChange={e => setFilterClass(e.target.value as any)}
                        className="px-4 py-2.5 bg-pw-surface border border-pw-border rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 transition-all min-w-[140px]"
                    >
                        <option value="all">All Classes</option>
                        <option value="9">Class 9</option>
                        <option value="10">Class 10</option>
                        <option value="11">Class 11</option>
                        <option value="12">Class 12</option>
                    </select>

                    <div className="relative">
                        <select
                            value={filterSubject}
                            onChange={e => {
                                setFilterSubject(e.target.value);
                                setFilterChapter(''); // Reset chapter on subject change
                            }}
                            className="px-4 py-2.5 bg-pw-surface border border-pw-border rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 transition-all min-w-[180px] capitalize"
                        >
                            <option value="">All Subjects</option>
                            {availableSubjects.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative">
                        <select
                            value={filterChapter}
                            onChange={e => setFilterChapter(e.target.value)}
                            disabled={!filterSubject}
                            className="px-4 py-2.5 bg-pw-surface border border-pw-border rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 transition-all min-w-[180px] capitalize disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">All Chapters</option>
                            {availableChapters.map(chap => (
                                <option key={chap} value={chap}>{chap}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {questions.map((q) => (
                        <div key={q.id} className="bg-white p-6 rounded-[1.5rem] border border-pw-border shadow-sm hover:shadow-pw-lg transition-all relative group hover:-translate-y-0.5">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(q)}
                                    className="p-2 bg-pw-indigo/10 text-pw-indigo rounded-xl hover:bg-pw-indigo/20 transition-colors"
                                    title="Edit"
                                >
                                    <HiPencil />
                                </button>
                                <button
                                    onClick={() => handleDelete(q.id)}
                                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                                    title="Delete"
                                >
                                    <HiTrash />
                                </button>
                            </div>

                            <div className="flex gap-3 mb-3">
                                <span className="px-3 py-1 bg-pw-surface border border-pw-border text-gray-500 text-xs font-bold rounded-lg uppercase tracking-wider">
                                    {q.board} {q.class}
                                </span>
                                <span className="px-3 py-1 bg-pw-indigo/10 text-pw-indigo text-xs font-bold rounded-lg uppercase tracking-wider">
                                    {q.subject}
                                </span>
                                <span className="px-3 py-1 bg-purple-50 text-purple-600 text-xs font-bold rounded-lg uppercase tracking-wider">
                                    {q.chapter}
                                </span>
                            </div>

                            <p className="font-bold text-pw-violet text-lg mb-4 pr-20 leading-relaxed">
                                {q.question}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                {q.options.map((opt, idx) => (
                                    <div
                                        key={idx}
                                        className={`px-4 py-3 rounded-xl border font-medium transition-colors ${idx === q.correctAnswer
                                            ? 'bg-green-50 border-green-200 text-green-700 shadow-sm'
                                            : 'bg-white border-gray-100 text-gray-500'}`}
                                    >
                                        <span className={`mr-2 font-bold ${idx === q.correctAnswer ? 'text-green-600' : 'text-gray-300'}`}>{String.fromCharCode(65 + idx)}.</span>
                                        {opt}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {questions.length === 0 && !loading && (
                        <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-[2rem]">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-4">
                                <HiSearch className="text-2xl" />
                            </div>
                            <p className="text-gray-400 font-bold mb-1">No questions found</p>
                            <p className="text-gray-500 text-sm">Try adjusting your filters or add a new question.</p>
                        </div>
                    )}
                </div>

                {/* Load More */}
                {hasMore && (
                    <div className="mt-10 text-center">
                        <button
                            onClick={() => fetchQuestions(false)}
                            disabled={loading}
                            className="px-8 py-3 bg-white border border-pw-border text-pw-indigo font-bold rounded-xl hover:bg-pw-surface shadow-pw-sm disabled:opacity-50 transition-all"
                        >
                            {loading ? 'Loading Questions...' : 'Load More Results'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
