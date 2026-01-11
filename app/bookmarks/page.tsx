'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { Question } from '@/data/types';
import { Header } from '@/components/shared/Header';
import { FaBookmark, FaTrash, FaChevronLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookmarksPage() {
    const { user, userProfile } = useAuth();
    const [bookmarks, setBookmarks] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchBookmarks = async () => {
            if (!user || !userProfile?.bookmarkedQuestions?.length) {
                setLoading(false);
                return;
            }

            try {
                const questions: Question[] = [];
                // Only allow up to 50 bookmarks to prevent overload
                const idsToFetch = userProfile.bookmarkedQuestions.slice(0, 50);

                for (const qId of idsToFetch) {
                    const qDoc = await getDoc(doc(db, 'questions', qId));
                    if (qDoc.exists()) {
                        questions.push({ id: qDoc.id, ...qDoc.data() } as Question);
                    }
                }
                setBookmarks(questions);
            } catch (error) {
                console.error('Error fetching bookmarks:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookmarks();
    }, [user, userProfile?.bookmarkedQuestions]);

    const removeBookmark = async (questionId: string) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                bookmarkedQuestions: arrayRemove(questionId)
            });
            setBookmarks(prev => prev.filter(q => q.id !== questionId));
        } catch (error) {
            console.error('Error removing bookmark:', error);
        }
    };

    const toggleAnswer = (id: string) => {
        const newRevealed = new Set(revealedAnswers);
        if (newRevealed.has(id)) {
            newRevealed.delete(id);
        } else {
            newRevealed.add(id);
        }
        setRevealedAnswers(newRevealed);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-pw-surface pt-20 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pw-indigo"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-pw-surface pb-20">
            <Header />
            <main className="pt-24 px-4 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="w-10 h-10 rounded-full bg-white border border-pw-border flex items-center justify-center text-gray-500 hover:text-pw-indigo shadow-sm transition-colors">
                        <FaChevronLeft />
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-pw-violet">My Bookmarks</h1>
                        <p className="text-sm text-gray-500">{bookmarks.length} saved questions</p>
                    </div>
                </div>

                {bookmarks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-pw-border shadow-md">
                        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                            <FaBookmark className="text-4xl text-amber-500/50" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Bookmarks Yet</h3>
                        <p className="text-gray-500 text-center max-w-xs mb-6">
                            Bookmark tricky questions during quizzes to review them here later.
                        </p>
                        <Link href="/play/selection" className="px-6 py-3 bg-pw-indigo text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all">
                            Start a Quiz
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        <AnimatePresence>
                            {bookmarks.map((question) => (
                                <motion.div
                                    key={question.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white rounded-2xl p-5 border border-pw-border shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase rounded-md border border-indigo-100">
                                                    {question.subject}
                                                </span>
                                                <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[10px] font-bold uppercase rounded-md border border-gray-100">
                                                    {question.difficulty}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-800 mb-4">{question.question}</h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                                                {question.options.map((opt, idx) => {
                                                    const isAnswer = revealedAnswers.has(question.id) && idx === question.correctAnswer;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`p-3 rounded-xl border text-sm font-medium transition-colors ${isAnswer
                                                                ? 'bg-green-50 border-green-200 text-green-700'
                                                                : 'bg-gray-50 border-gray-100 text-gray-600'
                                                                }`}
                                                        >
                                                            <span className="mr-2 opacity-50">{String.fromCharCode(65 + idx)}.</span>
                                                            {opt}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => toggleAnswer(question.id)}
                                                    className="flex items-center gap-2 text-sm font-bold text-pw-indigo hover:underline"
                                                >
                                                    {revealedAnswers.has(question.id) ? (
                                                        <><FaEyeSlash /> Hide Answer</>
                                                    ) : (
                                                        <><FaEye /> Show Answer</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeBookmark(question.id)}
                                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:scale-105 transition-all"
                                            title="Remove Bookmark"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            {/* SEO / Educational Content for AdSense */}
            <section className="max-w-4xl mx-auto px-4 pb-12 text-gray-500 text-sm leading-relaxed">
                <div className="border-t border-gray-200 pt-8 mt-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">Why Bookmark Questions?</h2>
                    <p className="mb-4">
                        Bookmarking is a powerful active recall strategy. By saving difficult or tricky questions, you create a personalized
                        revision repository. Reviewing these specific questions before exams helps target your weak areas, ensuring
                        better retention and higher scores.
                    </p>
                    <h3 className="font-bold text-gray-800 mb-2">How to use this feature effectively:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Save Tricky Concepts:</strong> Bookmark questions that stumped you during practice.</li>
                        <li><strong>Weekly Review:</strong> Revisit your bookmarks every Sunday to test if you've mastered the concept.</li>
                        <li><strong>Clean Up:</strong> Once you're confident, remove the bookmark to keep your list focused.</li>
                    </ul>
                </div>
            </section>
        </div>
    );
}
