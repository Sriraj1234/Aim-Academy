'use client'

import React, { useState, useEffect } from 'react'
import { HiX, HiSave, HiTrash, HiPencil, HiPlus, HiViewGrid } from 'react-icons/hi'
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
    const [selectedBoard, setSelectedBoard] = useState<string>('bseb')
    const [selectedClass, setSelectedClass] = useState<string>('10')
    const [selectedSubject, setSelectedSubject] = useState<string>('')

    // Data State
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
    const [chapters, setChapters] = useState<any[]>([])

    // Edit State
    const [newChapterName, setNewChapterName] = useState('')
    const [newChapterSection, setNewChapterSection] = useState('')
    const [editingChapterIndex, setEditingChapterIndex] = useState<number | null>(null)
    const [editChapterName, setEditChapterName] = useState('')
    const [editChapterSection, setEditChapterSection] = useState('')

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
                // Handle legacy string format
                if (typeof c === 'string') return { name: c, id: `chap-${Date.now()}-${i}`, section: 'General' }
                // Handle object format
                return {
                    name: c.name,
                    section: c.section || 'General',
                    id: c.id || `chap-${Date.now()}-${i}`
                }
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
        const newChapter = {
            name: newChapterName.trim(),
            section: newChapterSection.trim() || 'General',
            id: Date.now().toString(),
            count: 0
        }

        currentTaxonomy[key].chapters[selectedSubject].push(newChapter)

        await saveTaxonomy(currentTaxonomy)
        setNewChapterName('')
        setNewChapterSection('')
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

    const startEditing = (index: number, chap: any) => {
        setEditingChapterIndex(index)
        setEditChapterName(chap.name)
        setEditChapterSection(chap.section || 'General')
    }

    const cancelEditing = () => {
        setEditingChapterIndex(null)
        setEditChapterName('')
        setEditChapterSection('')
    }

    const saveEditing = async (index: number) => {
        if (!editChapterName.trim()) return

        const key = `${selectedBoard}_${selectedClass}`
        const currentTaxonomy = { ...taxonomy }

        const updatedChapters = [...currentTaxonomy[key].chapters[selectedSubject]]
        updatedChapters[index] = {
            ...updatedChapters[index],
            name: editChapterName.trim(),
            section: editChapterSection.trim() || 'General'
        }

        currentTaxonomy[key].chapters[selectedSubject] = updatedChapters

        await saveTaxonomy(currentTaxonomy)
        cancelEditing()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col"
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Manage Syllabus Content</h2>
                        <p className="text-xs text-slate-400">Add or reorder chapters and sections</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <HiX className="text-xl" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Selectors */}
                    <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Board</label>
                            <select
                                value={selectedBoard}
                                onChange={e => setSelectedBoard(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="bseb">BSEB (Bihar)</option>
                                <option value="cbse">CBSE</option>
                                <option value="icse">ICSE</option>
                                <option value="up">UP Board</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Class</label>
                            <select
                                value={selectedClass}
                                onChange={e => setSelectedClass(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="9">Class 9</option>
                                <option value="10">Class 10</option>
                                <option value="11">Class 11</option>
                                <option value="12">Class 12</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Subject</label>
                            <select
                                value={selectedSubject}
                                onChange={e => setSelectedSubject(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Select Subject</option>
                                {availableSubjects.map(sub => (
                                    <option key={sub} value={sub} className="capitalize">{sub}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Chapter List */}
                    {selectedSubject ? (
                        <div className="bg-white rounded-xl border border-slate-200 min-h-[400px] flex flex-col">

                            {/* Add New Bar */}
                            <div className="p-4 bg-slate-50 border-b border-slate-200 flex gap-2 items-end">
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Chapter Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Chemical Reactions"
                                        value={newChapterName}
                                        onChange={e => setNewChapterName(e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                                        onKeyDown={e => e.key === 'Enter' && handleAddChapter()}
                                    />
                                </div>
                                <div className="w-1/3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Section (Opt)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Poetry"
                                        value={newChapterSection}
                                        onChange={e => setNewChapterSection(e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                                        onKeyDown={e => e.key === 'Enter' && handleAddChapter()}
                                        list="section-suggestions"
                                    />
                                    <datalist id="section-suggestions">
                                        <option value="Prose" />
                                        <option value="Poetry" />
                                        <option value="Grammar" />
                                        <option value="Supplementary" />
                                        <option value="History" />
                                        <option value="Civics" />
                                        <option value="Geography" />
                                    </datalist>
                                </div>
                                <button
                                    onClick={handleAddChapter}
                                    disabled={!newChapterName.trim() || loading}
                                    className="bg-purple-600 text-white h-[38px] px-6 rounded-lg font-bold text-sm hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-1 shadow-sm"
                                >
                                    <HiPlus /> Add
                                </button>
                            </div>

                            <div className="flex-1 p-2 bg-slate-50/50">
                                <div className="flex justify-between items-center px-2 py-2">
                                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                        <HiViewGrid className="text-slate-400" />
                                        <span>Current Chapters</span>
                                    </h3>
                                    <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md">{chapters.length} Items</span>
                                </div>

                                {/* List with Drag and Drop */}
                                <Reorder.Group axis="y" values={chapters} onReorder={(newOrder) => setChapters(newOrder)} className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                                    {chapters.map((chap, idx) => (
                                        <Reorder.Item key={chap.id} value={chap}>
                                            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between group cursor-move hover:border-purple-300 hover:shadow-md transition-all">
                                                {editingChapterIndex === idx ? (
                                                    <div className="flex-1 flex gap-2 items-center" onPointerDown={(e) => e.stopPropagation()}>
                                                        <div className="flex-1 grid grid-cols-3 gap-2">
                                                            <input
                                                                type="text"
                                                                value={editChapterName}
                                                                onChange={e => setEditChapterName(e.target.value)}
                                                                className="col-span-2 p-1.5 border border-purple-300 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                                                autoFocus
                                                                placeholder="Name"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={editChapterSection}
                                                                onChange={e => setEditChapterSection(e.target.value)}
                                                                className="col-span-1 p-1.5 border border-purple-300 rounded text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                                                                placeholder="Section"
                                                            />
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button onClick={() => saveEditing(idx)} className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200 transition-colors"><HiSave /></button>
                                                            <button onClick={cancelEditing} className="bg-slate-100 text-slate-500 p-2 rounded-lg hover:bg-slate-200 transition-colors"><HiX /></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-slate-300 hover:text-purple-400 cursor-grab active:cursor-grabbing p-1">
                                                                ⋮⋮
                                                            </span>
                                                            <div>
                                                                <p className="text-slate-800 text-sm font-bold">{chap.name}</p>
                                                                {chap.section && chap.section !== 'General' && (
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{chap.section}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onPointerDown={(e) => e.stopPropagation()}>
                                                            <button
                                                                onClick={() => startEditing(idx, chap)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <HiPencil />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteChapter(idx)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                            </div>

                            {chapters.length > 0 && (
                                <div className="p-4 border-t border-slate-200 bg-white rounded-b-xl flex justify-between items-center">
                                    <p className="text-xs text-slate-400 italic">Drag items to reorder</p>
                                    <button
                                        onClick={() => {
                                            const key = `${selectedBoard}_${selectedClass}`
                                            const currentTaxonomy = { ...taxonomy }
                                            currentTaxonomy[key].chapters[selectedSubject] = chapters
                                            saveTaxonomy(currentTaxonomy)
                                            alert("Order Saved Successfully! ✅")
                                        }}
                                        className="text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-xl shadow-md transition-all active:scale-95"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[300px] bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-2xl">📚</div>
                            <p className="font-bold text-slate-500">No Subject Selected</p>
                            <p className="text-sm">Please select a board, class and subject above.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
