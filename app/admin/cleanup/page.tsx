'use client'

import { useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore'
import { FaTrash, FaExclamationTriangle } from 'react-icons/fa'

const TARGET_SUBJECTS = [
    'political science',
    'social science',
    'economics',
    'disaster management',
    'geography',
    'history'
]

export default function CleanupPage() {
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState<string[]>([])
    const [deletedCount, setDeletedCount] = useState(0)

    const handleCleanup = async () => {
        if (!confirm("Are you sure? This will PERMANENTLY delete all questions for these subjects. This cannot be undone.")) return;

        setLoading(true)
        setProgress(prev => [...prev, "Starting cleanup..."])
        let totalDeleted = 0

        try {
            for (const subject of TARGET_SUBJECTS) {
                setProgress(prev => [...prev, `Scanning subject: ${subject}...`])

                // Query all docs for this subject
                const q = query(collection(db, 'questions'), where('subject', '==', subject))
                const snapshot = await getDocs(q)

                if (snapshot.empty) {
                    setProgress(prev => [...prev, `No questions found for ${subject}.`])
                    continue
                }

                const count = snapshot.size
                setProgress(prev => [...prev, `Found ${count} questions for ${subject}. Deleting...`])

                // Batch delete (max 500 per batch)
                const chunks = []
                const docs = snapshot.docs
                for (let i = 0; i < docs.length; i += 500) {
                    chunks.push(docs.slice(i, i + 500))
                }

                for (const chunk of chunks) {
                    const batch = writeBatch(db)
                    chunk.forEach(docSnap => {
                        batch.delete(docSnap.ref)
                    })
                    await batch.commit()
                }

                totalDeleted += count
                setProgress(prev => [...prev, `Deleted ${count} questions for ${subject}.`])
            }

            setDeletedCount(totalDeleted)
            setProgress(prev => [...prev, "Cleanup Complete!"])

        } catch (error: any) {
            console.error(error)
            setProgress(prev => [...prev, `Error: ${error.message}`])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-red-600 flex items-center gap-2">
                <FaExclamationTriangle /> Database Cleanup Tool
            </h1>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                <h2 className="font-bold mb-4">Targeted Subjects for Deletion:</h2>
                <ul className="grid grid-cols-2 gap-2 mb-6">
                    {TARGET_SUBJECTS.map(s => (
                        <li key={s} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded border">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                            <span className="capitalize">{s}</span>
                        </li>
                    ))}
                </ul>

                <button
                    onClick={handleCleanup}
                    disabled={loading}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    {loading ? <span className="animate-spin">C</span> : <FaTrash />}
                    {loading ? "Cleaning..." : "Delete All Targeted Questions"}
                </button>
            </div>

            <div className="bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-xs h-64 overflow-y-auto">
                {progress.length === 0 ? (
                    <span className="text-gray-500">Waiting for command...</span>
                ) : (
                    progress.map((log, i) => <div key={i}>{log}</div>)
                )}
            </div>
            {deletedCount > 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-center font-bold">
                    Successfully deleted {deletedCount} questions.
                </div>
            )}
        </div>
    )
}
