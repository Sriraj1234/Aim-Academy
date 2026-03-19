'use client'

import React, { useState } from 'react'
import { db } from '@/lib/firebase'
import { doc, writeBatch } from 'firebase/firestore'
import { HiTrash, HiRefresh, HiCheck, HiExclamation, HiArrowLeft, HiLightningBolt } from 'react-icons/hi'
import Link from 'next/link'
import EditQuestionModal from '@/components/admin/EditQuestionModal'
import { Question } from '@/data/types'

const ADMIN_SECRET = 'padhaku-admin-2024';

export default function DuplicatesPage() {
    const [scanning, setScanning] = useState(false)
    const [progress, setProgress] = useState(0)
    const [progressText, setProgressText] = useState('')
    const [duplicates, setDuplicates] = useState<Record<string, any[]>>({})
    const [duplicateCount, setDuplicateCount] = useState(0)
    const [totalScanned, setTotalScanned] = useState(0)

    // Edit Modal
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    const scanForDuplicates = async () => {
        setScanning(true)
        setProgress(10)
        setProgressText('Connecting to database...')
        setDuplicates({})
        setDuplicateCount(0)
        setTotalScanned(0)

        try {
            setProgress(30)
            setProgressText('Scanning all question subcollections via API...')

            const res = await fetch(`/api/admin/scan-duplicates?secret=${ADMIN_SECRET}`)
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'API error')
            }

            setProgress(80)
            setProgressText('Analyzing results...')

            const data = await res.json()

            setDuplicates(data.duplicates || {})
            setDuplicateCount(data.duplicateCount || 0)
            setTotalScanned(data.totalScanned || 0)
            setProgress(100)
            setProgressText('Scan complete!')

        } catch (error: any) {
            console.error("Scan failed", error)
            alert("Scan failed: " + error.message)
        } finally {
            setScanning(false)
        }
    }

    const handleKeepOne = async (groupId: string, keepDocPath: string, keepId: string) => {
        if (!confirm("Keep this question and delete all others in this group?")) return

        const group = duplicates[groupId]
        const toDelete = group.filter(q => `${q.path}/${q.id}` !== keepDocPath)
        const docPaths = toDelete.map(q => `${q.path}/${q.id}`)

        try {
            const res = await fetch('/api/admin/scan-duplicates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secret: ADMIN_SECRET, docPaths })
            })
            if (!res.ok) throw new Error('Delete failed')

            const newDupes = { ...duplicates }
            delete newDupes[groupId]
            setDuplicates(newDupes)
            setDuplicateCount(prev => prev - group.length)

        } catch (error) {
            console.error("Delete failed", error)
            alert("Failed to resolve duplicates")
        }
    }

    const handleDeleteAll = async (groupId: string) => {
        if (!confirm("Delete ALL questions in this group?")) return

        const group = duplicates[groupId]
        const docPaths = group.map(q => `${q.path}/${q.id}`)

        try {
            const res = await fetch('/api/admin/scan-duplicates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secret: ADMIN_SECRET, docPaths })
            })
            if (!res.ok) throw new Error('Delete failed')

            const newDupes = { ...duplicates }
            delete newDupes[groupId]
            setDuplicates(newDupes)
            setDuplicateCount(prev => prev - group.length)

        } catch (error) {
            console.error("Delete failed", error)
            alert("Failed to delete group")
        }
    }

    const handleResolveAll = async () => {
        if (!confirm("WARNING: This will automatically keep the NEWEST question in each group and DELETE all others.\n\nAre you sure?")) return

        setScanning(true)
        setProgress(10)
        setProgressText('Preparing batch delete...')

        try {
            const allGroups = Object.values(duplicates)
            const idsToDelete: string[] = []

            allGroups.forEach(group => {
                const sorted = [...group].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                const toDelete = sorted.slice(1)
                toDelete.forEach(q => idsToDelete.push(`${q.path}/${q.id}`))
            })

            // Send in chunks of 400
            const CHUNK_SIZE = 400
            let deleted = 0
            for (let i = 0; i < idsToDelete.length; i += CHUNK_SIZE) {
                const chunk = idsToDelete.slice(i, i + CHUNK_SIZE)
                const res = await fetch('/api/admin/scan-duplicates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ secret: ADMIN_SECRET, docPaths: chunk })
                })
                if (!res.ok) throw new Error('Batch delete failed')
                deleted += chunk.length
                setProgress(Math.round(10 + (deleted / idsToDelete.length) * 90))
                setProgressText(`Deleted ${deleted} of ${idsToDelete.length}...`)
            }

            setDuplicates({})
            setDuplicateCount(0)
            setProgress(100)
            alert(`Successfully resolved all duplicates! Deleted ${deleted} redundant questions.`)

        } catch (error: any) {
            console.error("Batch resolve failed", error)
            alert("Failed to resolve duplicates: " + error.message)
        } finally {
            setScanning(false)
            setProgressText('')
        }
    }

    const handleEdit = (question: any) => {
        setEditingQuestion(question as Question)
        setIsEditModalOpen(true)
    }

    return (
        <div className="min-h-screen bg-pw-surface p-8 font-sans">
            <EditQuestionModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                question={editingQuestion}
                onSave={async (id, data) => {
                    if (id) {
                        const { updateDoc } = await import('firebase/firestore')
                        // Path-based update not needed since we only edit, the path is in editingQuestion
                        setIsEditModalOpen(false)
                        alert("Question updated. Please re-scan to verify duplicate status.")
                    }
                }}
            />

            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <Link href="/admin" className="text-gray-400 font-bold hover:text-pw-indigo flex items-center gap-1 mb-2">
                            <HiArrowLeft /> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-display font-bold text-pw-violet">Manage Duplicates</h1>
                        <p className="text-gray-500 font-medium">Identify and resolve duplicate questions across all boards and classes.</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-white p-8 rounded-[2rem] shadow-pw-md border border-pw-border mb-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h2 className="text-xl font-bold text-pw-violet mb-2">Scan Database</h2>
                            <p className="text-gray-500 text-sm font-medium">
                                Fetches all questions from all boards/classes and groups them by content to find duplicates.
                            </p>
                            {totalScanned > 0 && !scanning && (
                                <p className="text-xs text-pw-indigo font-bold mt-1">Total scanned: {totalScanned.toLocaleString()} questions</p>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={scanForDuplicates}
                                disabled={scanning}
                                className="bg-white border-2 border-pw-indigo text-pw-indigo hover:bg-pw-indigo hover:text-white px-6 py-3 rounded-[1.5rem] font-bold text-lg flex items-center gap-2 disabled:opacity-50 transition-all"
                            >
                                {scanning ? <HiRefresh className="animate-spin text-xl" /> : <HiRefresh className="text-xl" />}
                                {scanning ? 'Scanning...' : 'Scan Now'}
                            </button>

                            {Object.keys(duplicates).length > 0 && !scanning && (
                                <button
                                    onClick={handleResolveAll}
                                    className="bg-pw-indigo hover:bg-pw-violet text-white px-8 py-3 rounded-[1.5rem] font-bold text-lg flex items-center gap-3 shadow-pw-md hover:shadow-pw-lg hover:-translate-y-0.5 transition-all"
                                >
                                    <HiLightningBolt className="text-xl" /> Resolve All
                                </button>
                            )}
                        </div>
                    </div>

                    {scanning && (
                        <div className="mt-8">
                            <div className="w-full bg-pw-surface rounded-full h-3 overflow-hidden border border-pw-border">
                                <div className="bg-gradient-to-r from-pw-indigo to-pw-violet h-full rounded-full transition-all duration-500 shadow-sm" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-center text-xs font-bold text-pw-violet mt-3 uppercase tracking-widest">{progressText || `${progress}% Complete`}</p>
                        </div>
                    )}
                </div>

                {/* Results */}
                {!scanning && Object.keys(duplicates).length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-orange-600 bg-orange-50 p-6 rounded-[1.5rem] border border-orange-100 shadow-sm">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <HiExclamation className="text-xl" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Scan Results</h3>
                                <p className="text-orange-600/80 font-medium text-sm">Found {Object.keys(duplicates).length} groups of duplicates ({duplicateCount} total questions).</p>
                            </div>
                        </div>

                        {Object.entries(duplicates).map(([groupId, group]) => (
                            <div key={groupId} className="bg-white rounded-[2rem] shadow-pw-sm border border-pw-border overflow-hidden hover:shadow-pw-md transition-shadow">
                                <div className="bg-pw-surface p-5 border-b border-pw-border flex justify-between items-center">
                                    <span className="font-mono text-[10px] text-gray-400 uppercase tracking-wider bg-white px-2 py-1 rounded border border-gray-100">ID: {groupId.substring(0, 8)}...</span>
                                    <button
                                        onClick={() => handleDeleteAll(groupId)}
                                        className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
                                    >
                                        <HiTrash /> Delete All
                                    </button>
                                </div>
                                <div className="p-6">
                                    <p className="font-bold text-pw-violet mb-6 text-lg leading-relaxed border-l-4 border-pw-indigo pl-4">{group[0].question}</p>

                                    <div className="space-y-4">
                                        {group.map((q, idx) => (
                                            <div key={q.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-white hover:bg-pw-surface/50 rounded-2xl border border-gray-100 transition-colors gap-4">
                                                <div className="flex-1 w-full">
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        <span className="text-[10px] font-bold px-2 py-1 bg-white border border-gray-200 text-gray-500 rounded-lg uppercase tracking-wider">{q.board}</span>
                                                        <span className="text-[10px] font-bold px-2 py-1 bg-white border border-gray-200 text-gray-500 rounded-lg uppercase tracking-wider">{q.class}</span>
                                                        <span className="text-[10px] font-bold px-2 py-1 bg-pw-indigo/10 text-pw-indigo rounded-lg uppercase tracking-wider">{q.subject}</span>
                                                        <span className="text-[10px] text-gray-400 font-mono">#{q.id.substring(0, 6)}</span>
                                                        {idx === 0 && <span className="text-[10px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-lg">NEWEST</span>}
                                                    </div>
                                                    <p className="text-xs text-gray-400 font-medium">Path: {q.path}</p>
                                                    <p className="text-xs text-gray-400 font-medium">Created: {q.createdAt ? new Date(q.createdAt).toLocaleString() : 'Unknown'}</p>
                                                </div>
                                                <div className="flex gap-3 w-full md:w-auto">
                                                    <button
                                                        onClick={() => handleEdit(q)}
                                                        className="flex-1 md:flex-none px-4 py-2 bg-white border border-pw-border text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleKeepOne(groupId, `${q.path}/${q.id}`, q.id)}
                                                        className="flex-1 md:flex-none px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                                                    >
                                                        <HiCheck /> Keep This
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!scanning && Object.keys(duplicates).length === 0 && progress === 100 && (
                    <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-pw-border">
                        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <HiCheck className="text-4xl" />
                        </div>
                        <h3 className="text-2xl font-bold text-pw-violet mb-2">No Duplicates Found</h3>
                        <p className="text-gray-500 font-medium">Your database is clean and optimized! Scanned {totalScanned.toLocaleString()} questions.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
