'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaBook, FaDownload, FaChevronRight } from 'react-icons/fa'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, orderBy, limit, updateDoc, doc, increment } from 'firebase/firestore'
import { Note } from '@/data/types'
import Link from 'next/link'

const subjectIcons: Record<string, string> = {
    physics: '⚛️',
    chemistry: '🧪',
    biology: '🧬',
    mathematics: '📐',
    history: '📜',
    geography: '🌍',
    economics: '📊',
    'political science': '⚖️',
}

export const NotesSection = () => {
    const { user, userProfile } = useAuth()
    const [notes, setNotes] = useState<Note[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchNotes = async () => {
            if (!user) {
                setLoading(false)
                return
            }

            try {
                const notesRef = collection(db, 'notes')
                const constraints: any[] = [orderBy('uploadedAt', 'desc'), limit(6)]

                // Filter by user's class if available
                if (userProfile?.class) {
                    constraints.unshift(where('class', '==', userProfile.class))
                }

                const q = query(notesRef, ...constraints)
                const snapshot = await getDocs(q)

                const fetchedNotes: Note[] = []
                snapshot.forEach(doc => {
                    fetchedNotes.push({ id: doc.id, ...doc.data() } as Note)
                })
                setNotes(fetchedNotes)
            } catch (error) {
                console.error('Error fetching notes:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchNotes()
    }, [user, userProfile?.class])

    const handleDownload = async (note: Note) => {
        // Increment download count (Fire and forget)
        try {
            updateDoc(doc(db, 'notes', note.id), {
                downloadCount: increment(1)
            });
        } catch (e) {
            console.error('Failed to update download count', e)
        }
    }

    if (!user) return null

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-4 md:p-6 shadow-pw-md border border-pw-border"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <FaBook className="text-emerald-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-pw-violet">Study Notes</h2>
                        <p className="text-xs text-gray-500">Download PDFs for quick revision</p>
                    </div>
                </div>
                {notes.length > 0 && (
                    <Link
                        href="/notes"
                        className="text-xs font-bold text-pw-indigo hover:underline flex items-center gap-1"
                    >
                        View All <FaChevronRight size={10} />
                    </Link>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-pw-indigo border-t-transparent rounded-full animate-spin" />
                </div>
            ) : notes.length === 0 ? (
                <div className="text-center py-8 bg-pw-surface rounded-2xl border border-dashed border-gray-200">
                    <FaBook className="text-3xl text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm font-medium">No notes available yet</p>
                    <p className="text-gray-400 text-xs mt-1">Check back soon for study materials!</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {notes.map((note, index) => (
                        <motion.a
                            key={note.id}
                            href={note.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ y: -2 }}
                            onClick={() => handleDownload(note)}
                            className="flex flex-col items-center p-4 bg-pw-surface rounded-xl border border-pw-border hover:shadow-md transition-all text-center group overflow-hidden cursor-pointer"
                        >
                            <div className="text-3xl mb-2">
                                {subjectIcons[note.subject.toLowerCase()] || '📄'}
                            </div>
                            <h3 className="text-sm font-bold text-gray-800 line-clamp-2 mb-1 w-full break-words">
                                {note.title}
                            </h3>
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-bold uppercase mb-2 truncate max-w-full">
                                {note.subject}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-pw-indigo transition-colors">
                                <FaDownload size={10} />
                                <span>{note.downloadCount || 0}</span>
                            </div>
                        </motion.a>
                    ))}
                </div>
            )}
        </motion.section>
    )
}
