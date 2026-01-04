'use client'

import React, { useState, useEffect } from 'react'
import { HiX, HiSave, HiTrash, HiPencil, HiPlus } from 'react-icons/hi'
import { motion, Reorder } from 'framer-motion'
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Board, Class } from '@/data/types'

interface ManageChaptersModalProps {
    isOpen: boolean
    onClose: () => void
    onUpdate: () => void
}

export default function ManageChaptersModal({ isOpen, onClose, onUpdate }: ManageChaptersModalProps) {
    const [loading, setLoading] = useState(false)
    const [taxonomy, setTaxonomy] = useState<any>(null)

    // Selection State
    const [selectedBoard, setSelectedBoard] = useState<Board>('cbse')
    const [selectedClass, setSelectedClass] = useState<Class>('10')
    const [selectedSubject, setSelectedSubject] = useState<string>('')

    // Data State
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
    const [chapters, setChapters] = useState<any[]>([])

    // Edit State
    const [newChapterName, setNewChapterName] = useState('')
    const [editingChapterIndex, setEditingChapterIndex] = useState<number | null>(null)
    const [editChapterName, setEditChapterName] = useState('')

    // Fetch Taxonomy on Open
    useEffect(() => {
        if (isOpen) {
            fetchTaxonomy()
        }
    }, [isOpen])

    const fetchTaxonomy = async () => {
        setLoading(true)
        try {
            const docRef = doc(db, 'metadata', 'taxonomy')
            const docSnap = await getDoc(docRef)
            if (docSnap.exists()) {
                setTaxonomy(docSnap.data())
            } else {
                setTaxonomy({})
            }
        } catch (error) {
            console.error("Error loading taxonomy", error)
            alert("Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    // Update Available Subjects when Board/Class changes
    useEffect(() => {
        if (!taxonomy) return
        const key = `${selectedBoard}_${selectedClass}`
        const data = taxonomy[key]
        if (data && data.subjects) {
            setAvailableSubjects(data.subjects)
            // Reset subject if not in new list
            if (!data.subjects.includes(selectedSubject)) {
                setSelectedSubject('')
            }
        } else {
            setAvailableSubjects([])
            setSelectedSubject('')
        }
    }, [taxonomy, selectedBoard, selectedClass])

    // Update Chapters when Subject changes
    useEffect(() => {
        if (!taxonomy || !selectedSubject) {
            setChapters([])
            return
        }
        const key = `${selectedBoard}_${selectedClass}`
        const data = taxonomy[key]
        if (data && data.chapters && data.chapters[selectedSubject]) {
            // Normalize: Ensure all chapters are objects with IDs (for Reorder)
            const raw = data.chapters[selectedSubject];
            const normalized = raw.map((c: any, i: number) => {
                if (typeof c === 'string') return { name: c, id: `chap-${Date.now()}-${i}` }
                return { ...c, id: c.id || `chap-${Date.now()}-${i}` }
            })
            setChapters(normalized)
        } else {
            setChapters([])
        }
    }, [taxonomy, selectedBoard, selectedClass, selectedSubject])

    const saveTaxonomy = async (newTaxonomy: any) => {
        setLoading(true)
        try {
            const docRef = doc(db, 'metadata', 'taxonomy')
            await setDoc(docRef, newTaxonomy)
            setTaxonomy(newTaxonomy)
            onUpdate() // Notify parent to refresh
        } catch (error) {
            console.error("Error saving taxonomy", error)
            alert("Failed to save changes")
        } finally {
            setLoading(false)
        }
    }

    const handleAddChapter = async () => {
        if (!newChapterName.trim() || !selectedSubject) return

        const key = `${selectedBoard}_${selectedClass}`
        const currentTaxonomy = { ...taxonomy }

        // Ensure structure exists
        if (!currentTaxonomy[key]) currentTaxonomy[key] = {}
        if (!currentTaxonomy[key].chapters) currentTaxonomy[key].chapters = {}
        if (!currentTaxonomy[key].chapters[selectedSubject]) currentTaxonomy[key].chapters[selectedSubject] = []

        // Add new chapter
        // Assuming chapter object structure is { name: string, ... } based on usage
        const newChapter = { name: newChapterName.trim(), id: Date.now().toString() } // Adding ID for stability if needed, though simple name might be used

        currentTaxonomy[key].chapters[selectedSubject].push(newChapter)

        await saveTaxonomy(currentTaxonomy)
        setNewChapterName('')
    }

    const handleDeleteChapter = async (index: number) => {
        if (!confirm("Delete this chapter?")) return

        const key = `${selectedBoard}_${selectedClass}`
        const currentTaxonomy = { ...taxonomy }

        const updatedChapters = [...currentTaxonomy[key].chapters[selectedSubject]]
        updatedChapters.splice(index, 1)

        currentTaxonomy[key].chapters[selectedSubject] = updatedChapters

        await saveTaxonomy(currentTaxonomy)
    }

    const startEditing = (index: number, name: string) => {
        setEditingChapterIndex(index)
        setEditChapterName(name)
    }

    const cancelEditing = () => {
        setEditingChapterIndex(null)
        setEditChapterName('')
    }

    const saveEditing = async (index: number) => {
        if (!editChapterName.trim()) return

        const key = `${selectedBoard}_${selectedClass}`
        const currentTaxonomy = { ...taxonomy }

        const updatedChapters = [...currentTaxonomy[key].chapters[selectedSubject]]
        updatedChapters[index] = { ...updatedChapters[index], name: editChapterName.trim() }

        currentTaxonomy[key].chapters[selectedSubject] = updatedChapters

        await saveTaxonomy(currentTaxonomy)
        cancelEditing()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-slate-800">Manage Chapters</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <HiX className="text-xl" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Selectors */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-1">Board</label>
                            <select
                                value={selectedBoard}
                                onChange={e => setSelectedBoard(e.target.value as Board)}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-50"
                            >
                                <option value="cbse">CBSE</option>
                                <option value="icse">ICSE</option>
                                <option value="bseb">BSEB</option>
                                <option value="up">UP Board</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-1">Class</label>
                            <select
                                value={selectedClass}
                                onChange={e => setSelectedClass(e.target.value as Class)}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-50"
                            >
                                <option value="9">Class 9</option>
                                <option value="10">Class 10</option>
                                <option value="11">Class 11</option>
                                <option value="12">Class 12</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-1">Subject</label>
                            <select
                                value={selectedSubject}
                                onChange={e => setSelectedSubject(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-50"
                            >
                                <option value="">Select Subject</option>
                                {availableSubjects.map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Chapter List */}
                    {selectedSubject ? (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 min-h-[300px]">
                            <h3 className="font-bold text-slate-700 mb-4 flex items-center justify-between">
                                <span>Chapters for {selectedSubject}</span>
                                <span className="text-xs font-normal text-slate-500">{chapters.length} chapters</span>
                            </h3>

                            {/* Add New */}
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    placeholder="New Chapter Name"
                                    value={newChapterName}
                                    onChange={e => setNewChapterName(e.target.value)}
                                    className="flex-1 p-2 border border-slate-300 rounded-lg text-sm"
                                    onKeyDown={e => e.key === 'Enter' && handleAddChapter()}
                                />
                                <button
                                    onClick={handleAddChapter}
                                    disabled={!newChapterName.trim() || loading}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-700 disabled:opacity-50"
                                >
                                    Add
                                </button>
                            </div>

                            {/* List with Drag and Drop */}
                            <Reorder.Group axis="y" values={chapters} onReorder={setChapters} className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {chapters.map((chap, idx) => (
                                    <Reorder.Item key={chap.id || chap.name} value={chap}>
                                        <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between group cursor-move hover:border-purple-300 transition-colors shadow-sm">
                                            {editingChapterIndex === idx ? (
                                                <div className="flex-1 flex gap-2" onPointerDown={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="text"
                                                        value={editChapterName}
                                                        onChange={e => setEditChapterName(e.target.value)}
                                                        className="flex-1 p-1 border border-purple-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                        autoFocus
                                                    />
                                                    <button onClick={() => saveEditing(idx)} className="text-green-600 hover:bg-green-50 p-1 rounded"><HiSave /></button>
                                                    <button onClick={cancelEditing} className="text-slate-400 hover:bg-slate-100 p-1 rounded"><HiX /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-slate-400 cursor-grab active:cursor-grabbing">
                                                            ⋮⋮
                                                        </span>
                                                        <span className="text-slate-700 text-sm font-medium">{chap.name}</span>
                                                    </div>
                                                    <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity" onPointerDown={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => startEditing(idx, chap.name)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                            title="Edit"
                                                        >
                                                            <HiPencil />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteChapter(idx)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                            title="Delete"
                                                        >
                                                            <HiTrash />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>

                            {chapters.length > 0 && (
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => {
                                            // Manual trigger to save current order to Firestore
                                            const key = `${selectedBoard}_${selectedClass}`
                                            const currentTaxonomy = { ...taxonomy }
                                            currentTaxonomy[key].chapters[selectedSubject] = chapters
                                            saveTaxonomy(currentTaxonomy)
                                            alert("Order Saved!")
                                        }}
                                        className="text-xs font-bold text-purple-600 hover:bg-purple-50 px-3 py-1 bg-white border border-purple-200 rounded-lg transition-colors"
                                    >
                                        Save Order
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                            Select a subject to manage chapters
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
