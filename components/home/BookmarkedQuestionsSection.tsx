'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaBookmark, FaTrash, FaPlay, FaChevronRight } from 'react-icons/fa'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore'
import { Question } from '@/data/types'
import Link from 'next/link'

export const BookmarkedQuestionsSection = () => {
    const { user, userProfile } = useAuth()
    const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchBookmarks = async () => {
            if (!user || !userProfile?.bookmarkedQuestions?.length) {
                setLoading(false)
                return
            }

            try {
                const questions: Question[] = []
                // Fetch each bookmarked question (limit to 10 for display)
                const idsToFetch = userProfile.bookmarkedQuestions.slice(0, 10)

                for (const qId of idsToFetch) {
                    const qDoc = await getDoc(doc(db, 'questions', qId))
                    if (qDoc.exists()) {
                        questions.push({ id: qDoc.id, ...qDoc.data() } as Question)
                    }
                }
                setBookmarkedQuestions(questions)
            } catch (error) {
                console.error('Error fetching bookmarks:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchBookmarks()
    }, [user, userProfile?.bookmarkedQuestions])

    const removeBookmark = async (questionId: string) => {
        if (!user) return
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                bookmarkedQuestions: arrayRemove(questionId)
            })
            setBookmarkedQuestions(prev => prev.filter(q => q.id !== questionId))
        } catch (error) {
            console.error('Error removing bookmark:', error)
        }
    }

    if (!user) return null

    const totalBookmarks = userProfile?.bookmarkedQuestions?.length || 0

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-4 md:p-6 shadow-pw-md border border-pw-border"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <FaBookmark className="text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-pw-violet">Bookmarked Questions</h2>
                        <p className="text-xs text-gray-500">{totalBookmarks} saved questions</p>
                    </div>
                </div>
                {totalBookmarks > 0 && (
                    <Link
                        href="/bookmarks"
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
            ) : bookmarkedQuestions.length === 0 ? (
                <div className="text-center py-8 bg-pw-surface rounded-2xl border border-dashed border-gray-200">
                    <FaBookmark className="text-3xl text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm font-medium">No bookmarks yet</p>
                    <p className="text-gray-400 text-xs mt-1">Bookmark questions during quizzes to review later!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {bookmarkedQuestions.slice(0, 3).map((question, index) => (
                        <motion.div
                            key={question.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-3 p-3 bg-pw-surface rounded-xl border border-pw-border hover:shadow-sm transition-shadow"
                        >
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-pw-lavender/30 flex items-center justify-center text-pw-indigo font-bold text-sm">
                                {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800 font-medium line-clamp-2">
                                    {question.question}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-bold uppercase">
                                        {question.subject}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {question.chapter}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => removeBookmark(question.id)}
                                className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove bookmark"
                            >
                                <FaTrash size={12} />
                            </button>
                        </motion.div>
                    ))}

                    {totalBookmarks > 3 && (
                        <Link
                            href="/bookmarks"
                            className="block text-center py-3 bg-pw-lavender/20 rounded-xl text-pw-indigo text-sm font-bold hover:bg-pw-lavender/30 transition-colors"
                        >
                            View {totalBookmarks - 3} more bookmarks →
                        </Link>
                    )}
                </div>
            )}
        </motion.section>
    )
}
