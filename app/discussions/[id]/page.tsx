'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaArrowUp, FaCheckCircle, FaCheck, FaReply, FaClock, FaShieldAlt, FaTrash } from 'react-icons/fa';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { useAnswers, useDiscussions, Discussion } from '@/hooks/useDiscussions';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function DiscussionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const discussionId = params.id as string;
    const { user } = useAuth();

    // Get delete function from hook but we don't need the list here
    const { deleteDiscussion } = useDiscussions();

    const [discussion, setDiscussion] = useState<Discussion | null>(null);
    const [loading, setLoading] = useState(true);
    const [answerText, setAnswerText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const { answers, addAnswer, markBestAnswer, upvoteAnswer } = useAnswers(discussionId);

    useEffect(() => {
        const fetchDiscussion = async () => {
            const docRef = doc(db, 'discussions', discussionId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setDiscussion({ id: docSnap.id, ...docSnap.data() } as Discussion);
            }
            setLoading(false);
        };
        fetchDiscussion();
    }, [discussionId]);

    const formatTime = (timestamp: Timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp as any);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleSubmitAnswer = async () => {
        if (!answerText.trim()) return;
        setSubmitting(true);
        try {
            await addAnswer(answerText);
            setAnswerText('');
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-pw-surface dark:bg-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-pw-indigo border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!discussion) {
        return (
            <div className="min-h-screen bg-pw-surface dark:bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-pw-violet mb-2">Discussion Not Found</h2>
                    <Link href="/discussions" className="text-pw-indigo hover:underline">Go Back</Link>
                </div>
            </div>
        );
    }

    const isAuthor = user?.uid === discussion.authorId;

    return (
        <div className="min-h-screen bg-pw-surface dark:bg-slate-950 pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-pw-border dark:border-slate-800 sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-pw-surface dark:hover:bg-slate-800 rounded-full">
                        <FaArrowLeft className="text-pw-violet dark:text-white" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-pw-violet dark:text-white">Discussion</h1>
                        <p className="text-xs text-gray-500">{discussion.subject} • {discussion.chapter || 'General'}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Question Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-pw-border dark:border-slate-800 mb-6"
                >
                    <div className="flex items-start gap-4">
                        {/* Votes */}
                        <div className="flex flex-col items-center gap-1">
                            <button className="p-2 hover:bg-pw-surface dark:hover:bg-slate-800 rounded-full text-gray-400 hover:text-pw-indigo">
                                <FaArrowUp />
                            </button>
                            <span className="font-bold text-pw-indigo">{discussion.upvotes}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                {discussion.status === 'solved' && (
                                    <span className="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                                        <FaCheckCircle /> Solved
                                    </span>
                                )}
                                <span className="bg-pw-surface dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-medium text-pw-indigo">
                                    {discussion.subject}
                                </span>
                            </div>

                            <h2 className="text-xl font-bold text-pw-violet dark:text-white mb-3">
                                {discussion.title}
                            </h2>

                            <p className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap mb-4">
                                {discussion.body}
                            </p>

                            <div className="flex items-center gap-3 text-sm text-gray-400 pt-4 border-t border-pw-border dark:border-slate-800">
                                <img
                                    src={discussion.authorPhoto || `https://ui-avatars.com/api/?name=${discussion.authorName}`}
                                    alt=""
                                    className="w-6 h-6 rounded-full"
                                />
                                <span>{discussion.authorName}</span>
                                <span className="flex items-center gap-1">
                                    <FaClock className="text-xs" />
                                    {formatTime(discussion.createdAt)}
                                </span>

                                {isAuthor && (
                                    <button
                                        onClick={async () => {
                                            if (confirm('Are you sure you want to delete this doubt?')) {
                                                try {
                                                    await deleteDiscussion(discussion.id);
                                                    router.push('/discussions');
                                                    toast.success('Doubt deleted successfully');
                                                } catch (e) {
                                                    toast.error('Failed to delete doubt');
                                                }
                                            }
                                        }}
                                        className="ml-auto text-red-500 hover:text-red-600 font-medium flex items-center gap-1 text-xs"
                                    >
                                        <FaTrash /> Delete Doubt
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Answers Section */}
                <div className="mb-6">
                    <h3 className="font-bold text-pw-violet dark:text-white mb-4">
                        {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
                    </h3>

                    {answers.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-pw-border dark:border-slate-800 text-center">
                            <p className="text-gray-500 dark:text-slate-400 mb-2">No answers yet</p>
                            <p className="text-sm text-gray-400">Be the first to help!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {answers.map((answer, idx) => (
                                <motion.div
                                    key={answer.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 ${answer.isBestAnswer
                                        ? 'border-green-400 dark:border-green-500'
                                        : 'border-pw-border dark:border-slate-800'
                                        }`}
                                >
                                    {answer.isBestAnswer && (
                                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-3 text-sm font-bold">
                                            <FaCheckCircle /> Best Answer
                                        </div>
                                    )}
                                    {answer.isVerified && (
                                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-3 text-sm font-bold">
                                            <FaShieldAlt /> Teacher Verified
                                        </div>
                                    )}

                                    <div className="flex items-start gap-4">
                                        <div className="flex flex-col items-center gap-1">
                                            <button
                                                onClick={() => upvoteAnswer(answer.id)}
                                                className="p-2 hover:bg-pw-surface dark:hover:bg-slate-800 rounded-full text-gray-400 hover:text-pw-indigo"
                                            >
                                                <FaArrowUp />
                                            </button>
                                            <span className={`font-bold ${answer.upvotes > 0 ? 'text-pw-indigo' : 'text-gray-400'}`}>
                                                {answer.upvotes}
                                            </span>
                                        </div>

                                        <div className="flex-1">
                                            <p className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap mb-3">
                                                {answer.body}
                                            </p>

                                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                                <img
                                                    src={answer.authorPhoto || `https://ui-avatars.com/api/?name=${answer.authorName}`}
                                                    alt=""
                                                    className="w-5 h-5 rounded-full"
                                                />
                                                <span>{answer.authorName}</span>
                                                <span className="flex items-center gap-1">
                                                    <FaClock className="text-xs" />
                                                    {formatTime(answer.createdAt)}
                                                </span>

                                                {isAuthor && !answer.isBestAnswer && discussion.status !== 'solved' && (
                                                    <button
                                                        onClick={() => markBestAnswer(answer.id)}
                                                        className="ml-auto text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                                                    >
                                                        <FaCheck /> Mark as Best
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Answer Form */}
                {user && (
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-pw-border dark:border-slate-800">
                        <h4 className="font-bold text-pw-violet dark:text-white mb-3 flex items-center gap-2">
                            <FaReply className="text-pw-indigo" /> Your Answer
                        </h4>
                        <textarea
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            placeholder="Write your answer here..."
                            rows={4}
                            className="w-full p-4 bg-pw-surface dark:bg-slate-800 border border-pw-border dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-pw-indigo/20 resize-none mb-3"
                        />
                        <button
                            onClick={handleSubmitAnswer}
                            disabled={!answerText.trim() || submitting}
                            className="bg-pw-indigo text-white px-6 py-2.5 rounded-xl font-bold disabled:opacity-50"
                        >
                            {submitting ? 'Posting...' : 'Post Answer'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
