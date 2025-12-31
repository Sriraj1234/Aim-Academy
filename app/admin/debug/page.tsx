'use client'

import React, { useEffect, useState } from 'react'
import { collection, getDocs, limit, query, orderBy, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function DebugPage() {
    const [questions, setQuestions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                // Fetch latest 50 questions
                const q = query(collection(db, 'questions'), limit(50))
                const snapshot = await getDocs(q)
                const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
                setQuestions(data)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchQuestions()
    }, [])

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Data Inspector (Last 50 Questions)</h1>
            <div className="bg-white p-4 rounded shadow overflow-x-auto">
                {loading ? <p>Loading...</p> : (
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="p-2">Board</th>
                                <th className="p-2">Class</th>
                                <th className="p-2">Subject</th>
                                <th className="p-2">Chapter</th>
                                <th className="p-2">Question</th>
                            </tr>
                        </thead>
                        <tbody>
                            {questions.map(q => (
                                <tr key={q.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2 border">{q.board}</td>
                                    <td className="p-2 border">{q.class}</td>
                                    <td className="p-2 border">{q.subject}</td>
                                    <td className="p-2 border">{q.chapter}</td>
                                    <td className="p-2 border truncate max-w-xs">{q.question}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <div className="mt-8">
                <h2 className="font-bold">Debugging Info:</h2>
                <p>Check if "Board" and "Class" match exactly what is in your Profile.</p>
                <p>Uploads usually save as 'cbse', '10'. Profile might be 'CBSE', '10'.</p>
                <p>Quiz Filter logic now tries to match case-insensitive for Board.</p>
            </div>

            <MetadataInspector />
        </div>
    )
}

function MetadataInspector() {
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        getDoc(doc(db, 'metadata', 'taxonomy')).then(s => setData(s.data()))
    }, [])

    return (
        <div className="mt-8 p-4 bg-white rounded shadow">
            <h2 className="font-bold mb-2">Metadata Dump (Taxonomy)</h2>
            <pre className="text-xs bg-slate-800 text-green-400 p-4 rounded overflow-auto h-96">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    )
}
