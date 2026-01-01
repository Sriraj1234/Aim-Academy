'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/shared/Header'
import { MediaUploader } from '@/components/admin/MediaUploader'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { FaBook, FaSave, FaLock, FaTrash } from 'react-icons/fa'
import { useAuth } from '@/hooks/useAuth'

const UploadPage = () => {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        subject: 'physics',
        chapter: '',
        class: '10',
        board: 'CBSE',
        pdfUrl: '',
    })

    // Simple Admin Check (Replace with better RBAC later)
    // For now, checks if user is logged in. 
    // Ideally, check user.email === 'jayan@example.com' etc.
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleUploadSuccess = (url: string) => {
        setFormData(prev => ({ ...prev, pdfUrl: url }))
    }

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
                pdfUrl: '',
            })
        } catch (error) {
            console.error('Error saving note:', error)
            alert('Failed to save note.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-pw-surface pb-20">
            <Header />

            <div className="pt-24 px-4 max-w-2xl mx-auto">
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
            </div>
        </div>
    )
}

export default UploadPage
