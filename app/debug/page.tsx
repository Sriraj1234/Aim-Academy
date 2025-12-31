'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, limit, doc, getDoc, query } from 'firebase/firestore'

export default function DebugPage() {
    const [questions, setQuestions] = useState<any[]>([])
    const [metadata, setMetadata] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            try {
                // 1. Fetch Questions
                const qSnap = await getDocs(query(collection(db, 'questions'), limit(20)))
                const qData = qSnap.docs.map(d => ({ id: d.id, ...d.data() }))
                setQuestions(qData)

                // 2. Fetch Metadata
                const mSnap = await getDoc(doc(db, 'metadata', 'taxonomy'))
                if (mSnap.exists()) {
                    setMetadata(mSnap.data())
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    if (loading) return <div className="p-10 text-white">Loading Debug Data...</div>

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 font-mono">
            <h1 className="text-2xl font-bold mb-4">Data Debugger</h1>

            <div className="grid grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-bold mb-2 text-blue-400">Metadata (taxonomy)</h2>
                    <pre className="bg-black p-4 rounded overflow-auto h-96 text-xs">
                        {metadata ? JSON.stringify(metadata, null, 2) : 'No Metadata Found'}
                    </pre>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2 text-green-400">Sample Questions (First 20)</h2>
                    <div className="bg-black p-4 rounded overflow-auto h-96 text-xs space-y-2">
                        {questions.map(q => (
                            <div key={q.id} className="border-b border-gray-800 pb-2">
                                <div className="text-gray-500">{q.id}</div>
                                <div><span className="text-yellow-400">Subject:</span> {q.subject}</div>
                                <div><span className="text-purple-400">Chapter:</span> {q.chapter}</div>
                                <div><span className="text-gray-400">Text:</span> {q.question?.substring(0, 50)}...</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
