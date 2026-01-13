'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaFilter, FaSearch, FaCheckCircle, FaArrowUp, FaComments, FaClock, FaChevronRight, FaTrash, FaImage, FaTimes, FaSpinner } from 'react-icons/fa';
import { useDiscussions, Discussion } from '@/hooks/useDiscussions';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { InteractiveLoading } from '@/components/shared/InteractiveLoading';

export default function DiscussionsPage() {
    const { userProfile } = useAuth();
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAskModal, setShowAskModal] = useState(false);

    const { discussions, loading, createDiscussion } = useDiscussions(
        userProfile?.board,
        userProfile?.class,
        selectedSubject || undefined
    );

    // Get unique subjects from user's taxonomy
    const subjects = ['Math', 'Science', 'Social Science', 'Hindi', 'English', 'Sanskrit'];

    const filteredDiscussions = discussions.filter(d =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.body.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        return 'Just now';
    };

    return (
        <div className="min-h-screen bg-pw-surface dark:bg-slate-950 pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-pw-border dark:border-slate-800 sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-pw-violet dark:text-white flex items-center gap-2">
                                <FaComments className="text-pw-indigo" />
                                Discussion Board
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                {userProfile?.board?.toUpperCase() || 'Bihar'} Board • Class {userProfile?.class || '10'}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAskModal(true)}
                            className="flex items-center gap-2 bg-pw-indigo text-white px-4 py-2.5 rounded-xl font-bold shadow-pw-md hover:bg-pw-violet transition-colors"
                        >
                            <FaPlus /> Ask Doubt
                        </button>
                    </div>

                    {/* Search & Filter */}
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search doubts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-pw-surface dark:bg-slate-800 border border-pw-border dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-pw-indigo/20 outline-none"
                            />
                        </div>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="px-4 py-2.5 bg-pw-surface dark:bg-slate-800 border border-pw-border dark:border-slate-700 rounded-xl text-sm font-medium text-pw-violet dark:text-white focus:ring-2 focus:ring-pw-indigo/20 outline-none"
                        >
                            <option value="">All Subjects</option>
                            {subjects.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Discussions List */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                {loading ? (
                    <InteractiveLoading message="Loading discussions..." fullScreen={false} />
                ) : filteredDiscussions.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-pw-border dark:border-slate-800">
                        <FaComments className="text-5xl text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-pw-violet dark:text-white mb-2">No Doubts Yet</h3>
                        <p className="text-gray-500 dark:text-slate-400 mb-4">Be the first to ask a question!</p>
                        <button
                            onClick={() => setShowAskModal(true)}
                            className="bg-pw-indigo text-white px-6 py-2.5 rounded-xl font-bold"
                        >
                            Ask First Doubt
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredDiscussions.map((discussion, idx) => (
                            <DiscussionCard key={discussion.id} discussion={discussion} index={idx} formatTime={formatTime} />
                        ))}
                    </div>
                )}
            </div>

            {/* Ask Doubt Modal */}
            <AnimatePresence>
                {showAskModal && (
                    <AskDoubtModal
                        onClose={() => setShowAskModal(false)}
                        onSubmit={async (data) => {
                            try {
                                await createDiscussion(data);
                                setShowAskModal(false);
                                toast.success('Doubt posted successfully!');
                            } catch (e: any) {
                                console.error(e);
                                toast.error(e.message || 'Failed to post doubt');
                            }
                        }}
                        subjects={subjects}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function DiscussionCard({ discussion, index, formatTime }: { discussion: Discussion; index: number; formatTime: (t: any) => string }) {
    const { user } = useAuth();
    const { deleteDiscussion } = useDiscussions();
    const isAuthor = user?.uid === discussion.authorId;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative"
        >
            <Link href={`/discussions/${discussion.id}`}>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-pw-border dark:border-slate-800 hover:shadow-pw-md transition-shadow cursor-pointer">
                    <div className="flex gap-3">
                        {/* Votes */}
                        <div className="flex flex-col items-center gap-1 text-center min-w-[50px]">
                            <div className={`text-lg font-bold ${discussion.upvotes > 0 ? 'text-pw-indigo' : 'text-gray-400'}`}>
                                {discussion.upvotes}
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase">votes</div>
                            <div className={`mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${discussion.answerCount > 0
                                ? discussion.status === 'solved'
                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                {discussion.answerCount} {discussion.status === 'solved' && <FaCheckCircle className="inline ml-1" />}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-pw-violet dark:text-white group-hover:text-pw-indigo transition-colors line-clamp-2 mb-1 pr-8">
                                {discussion.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-2 mb-2">
                                {discussion.body}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                <span className="bg-pw-surface dark:bg-slate-800 px-2 py-0.5 rounded font-medium text-pw-indigo">
                                    {discussion.subject}
                                </span>
                                {discussion.chapter && (
                                    <span className="truncate max-w-[150px]">{discussion.chapter}</span>
                                )}
                                <span className="flex items-center gap-1">
                                    {formatTime(discussion.createdAt)}
                                </span>
                                <span className="ml-auto text-gray-400">by {discussion.authorName}</span>
                            </div>

                            {/* Discussion Image Preview */}
                            {discussion.imageUrls && discussion.imageUrls.length > 0 && (
                                <div className="mt-3 relative h-48 w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={discussion.imageUrls[0]}
                                        alt="Discussion attachment"
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            )}
                        </div>

                        <FaChevronRight className="text-gray-300 group-hover:text-pw-indigo transition-colors self-center" />
                    </div>
                </div>
            </Link>

            {/* Delete Button */}
            {isAuthor && (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm('Delete this doubt?')) {
                            deleteDiscussion(discussion.id);
                            toast.success('Doubt deleted');
                        }
                    }}
                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors bg-white dark:bg-slate-900 rounded-full p-1 border border-transparent hover:border-red-100 z-10"
                    title="Delete Doubt"
                >
                    <FaTrash />
                </button>
            )}
        </motion.div>
    );
}

function AskDoubtModal({ onClose, onSubmit, subjects }: {
    onClose: () => void;
    onSubmit: (data: { title: string; body: string; subject: string; chapter?: string }) => Promise<void>;
    subjects: string[];
}) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [subject, setSubject] = useState('');
    const [chapter, setChapter] = useState('');
    const [loading, setLoading] = useState(false);

    // Image Upload State
    const [imageState, setImageState] = useState<{
        file: File | null;
        preview: string | null;
        url: string | null;
        uploading: boolean
    }>({ file: null, preview: null, url: null, uploading: false });

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const objectUrl = URL.createObjectURL(file);
        setImageState(prev => ({ ...prev, file, preview: objectUrl, uploading: true }));

        try {
            // Compress Image
            console.log(`Original size: ${file.size / 1024} KB`);
            const options = {
                maxSizeMB: 0.1, // 100KB
                maxWidthOrHeight: 1280,
                useWebWorker: true
            };

            const compressedFile = await imageCompression(file, options);
            console.log(`Compressed size: ${compressedFile.size / 1024} KB`);

            // Upload directly to existing API
            const formData = new FormData();
            formData.append('file', compressedFile);
            formData.append('folder', 'discussions'); // Use correct folder

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Upload failed');

            setImageState(prev => ({
                ...prev,
                url: data.url,
                uploading: false
            }));

            toast.success('Image compressed & uploaded!');

        } catch (error) {
            console.error('Image processing failed:', error);
            toast.error('Failed to process image');
            setImageState(prev => ({ ...prev, uploading: false }));
        }
    };

    const removeImage = () => {
        setImageState({ file: null, preview: null, url: null, uploading: false });
    };

    const handleSubmit = async () => {
        if (!title || !body || !subject) return;
        setLoading(true);
        try {
            await onSubmit({
                title,
                body,
                subject,
                chapter: chapter || undefined,
                // Add image URLs if present
                ...(imageState.url ? { imageUrls: [imageState.url] } : {})
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold text-pw-violet dark:text-white mb-4 flex items-center gap-2">
                    <FaPlus className="text-pw-indigo" /> Ask a Doubt
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-slate-300 mb-1">Subject *</label>
                        <select
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-2.5 bg-pw-surface dark:bg-slate-800 border border-pw-border dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-pw-indigo/20"
                        >
                            <option value="">Select Subject</option>
                            {subjects.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-slate-300 mb-1">Chapter (Optional)</label>
                        <input
                            type="text"
                            value={chapter}
                            onChange={(e) => setChapter(e.target.value)}
                            placeholder="e.g. Triangles, Acids & Bases"
                            className="w-full px-4 py-2.5 bg-pw-surface dark:bg-slate-800 border border-pw-border dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-pw-indigo/20"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-slate-300 mb-1">Question Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Write a clear, short title"
                            className="w-full px-4 py-2.5 bg-pw-surface dark:bg-slate-800 border border-pw-border dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-pw-indigo/20"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-slate-300 mb-1">Details *</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Explain your doubt in detail. Include what you've already tried."
                            rows={5}
                            className="w-full px-4 py-2.5 bg-pw-surface dark:bg-slate-800 border border-pw-border dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-pw-indigo/20 resize-none"
                        />
                    </div>
                </div>

                {/* Image Upload Section */}
                <div>
                    <label className="block text-sm font-bold text-gray-600 dark:text-slate-300 mb-2">
                        Add Image (Optional)
                    </label>

                    {!imageState.preview ? (
                        <label className="flex items-center gap-2 px-4 py-2.5 bg-pw-surface dark:bg-slate-800 border border-dashed border-pw-indigo/50 rounded-xl cursor-pointer hover:bg-pw-indigo/5 transition-colors text-pw-indigo">
                            <FaImage />
                            <span className="text-sm font-bold">Select Image (Auto-compress to 100KB)</span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageSelect}
                            />
                        </label>
                    ) : (
                        <div className="relative inline-block">
                            <div className="h-24 w-24 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={imageState.preview}
                                    alt="Preview"
                                    className={`w-full h-full object-cover ${imageState.uploading ? 'opacity-50' : ''}`}
                                />
                                {imageState.uploading && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <FaSpinner className="animate-spin text-pw-indigo text-xl" />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={removeImage}
                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"
                                disabled={imageState.uploading}
                            >
                                <FaTimes size={12} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-xl font-bold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!title || !body || !subject || loading || imageState.uploading}
                        className="flex-1 py-2.5 bg-pw-indigo text-white rounded-xl font-bold disabled:opacity-50"
                    >
                        {loading ? 'Posting...' : 'Post Doubt'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
