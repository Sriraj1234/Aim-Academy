'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, where, serverTimestamp, getDoc } from 'firebase/firestore';
import { FaYoutube, FaTrash, FaEdit, FaPlus, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { VideoResource } from '@/data/types';
import { toast } from 'react-hot-toast';

export default function StudyHubAdmin() {
    const { user } = useAuth();
    const [videos, setVideos] = useState<VideoResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [availableChapters, setAvailableChapters] = useState<{ name: string, count: number }[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        videoUrl: '',
        board: 'cbse',
        classLevel: '10',
        subject: 'Physics',
        chapter: '',
        teacherName: '',
        channelName: '',
        hasQuiz: false,
        linkedQuizChapter: '',
        views: 0
    });

    // YouTube Parser
    const extractVideoID = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Fetch Taxonomy for Quiz Linking
    useEffect(() => {
        const fetchTaxonomy = async () => {
            if (!formData.board || !formData.classLevel || !formData.subject) return;

            try {
                const docRef = doc(db, 'metadata', 'taxonomy');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const taxonomy = docSnap.data();
                    const key = `${formData.board}_${formData.classLevel}`;
                    const categoryData = taxonomy[key];

                    if (categoryData && categoryData.chapters) {
                        // Robust Subject Matching: Try exact match, then case-insensitive
                        let targetSubject = formData.subject;
                        const availableSubjects = Object.keys(categoryData.chapters);

                        // Try to find the correct casing key from available subjects
                        const matchedKey = availableSubjects.find(s => s.toLowerCase() === targetSubject.toLowerCase());

                        const chapters = matchedKey ? categoryData.chapters[matchedKey] : [];
                        setAvailableChapters(chapters);
                    } else {
                        setAvailableChapters([]);
                    }
                }
            } catch (error) {
                console.error("Board taxonomy fetch error", error);
            }
        };
        fetchTaxonomy();
    }, [formData.board, formData.classLevel, formData.subject]);

    const fetchVideos = async () => {
        try {
            const q = query(collection(db, 'video_resources'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoResource));
            setVideos(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load videos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchVideos();
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        let value = e.target.value;
        // Auto-capitalize Subject for consistency
        if (e.target.name === 'subject' && value.length > 0) {
            value = value.charAt(0).toUpperCase() + value.slice(1);
        }
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const videoId = extractVideoID(formData.videoUrl);

        if (!videoId) {
            toast.error('Invalid YouTube URL');
            return;
        }

        if (!formData.chapter || !formData.teacherName || !formData.channelName) {
            toast.error('All fields are required');
            return;
        }

        setSubmitting(true);
        try {
            await addDoc(collection(db, 'video_resources'), {
                ...formData,
                videoId,
                thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                uploadedBy: user?.uid,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
            toast.success('Video added successfully!');
            setFormData({ ...formData, title: '', videoUrl: '', chapter: '', hasQuiz: false, linkedQuizChapter: '' }); // Reset partial
            fetchVideos();
        } catch (error) {
            console.error(error);
            toast.error('Failed to add video');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this resource?')) return;
        try {
            await deleteDoc(doc(db, 'video_resources', id));
            toast.success('Video deleted');
            setVideos(prev => prev.filter(v => v.id !== id));
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FaYoutube className="text-red-600" /> Study Hub Manager
            </h1>

            {/* Add Video Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FaPlus className="text-pw-indigo" /> Add New Resource
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Taxonomy */}
                    <select name="board" value={formData.board} onChange={handleChange} className="p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-pw-indigo/20 outline-none">
                        <option value="cbse">CBSE</option>
                        <option value="icse">ICSE</option>
                        <option value="bseb">Bihar Board</option>
                        <option value="up">UP Board</option>
                    </select>

                    <select name="classLevel" value={formData.classLevel} onChange={handleChange} className="p-3 border rounded-xl bg-gray-50 outline-none">
                        <option value="9">Class 9</option>
                        <option value="10">Class 10</option>
                        <option value="11">Class 11</option>
                        <option value="12">Class 12</option>
                    </select>

                    <input
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Subject (Physics, Math...)"
                        className="p-3 border rounded-xl bg-gray-50 outline-none"
                        required
                    />

                    <input
                        name="chapter"
                        value={formData.chapter}
                        onChange={handleChange}
                        placeholder="Chapter Name (e.g. Light)"
                        className="p-3 border rounded-xl bg-gray-50 outline-none"
                        required
                    />

                    {/* Advanced Options - Quiz Linking */}
                    <div className="md:col-span-4 bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <div className="flex items-center gap-2 mb-3 cursor-pointer" onClick={() => {
                            const newState = !formData.hasQuiz;

                            // Auto-try to match current chapter name when enabling
                            let defaultLink = formData.linkedQuizChapter;
                            if (newState && formData.chapter) {
                                // Try to find exact match in available chapters
                                const match = availableChapters.find(c => c.name.toLowerCase() === formData.chapter.toLowerCase());
                                if (match) defaultLink = match.name;
                                else defaultLink = formData.chapter; // Fallback to current input
                            }

                            setFormData(prev => ({
                                ...prev,
                                hasQuiz: newState,
                                linkedQuizChapter: newState ? defaultLink : ''
                            }));
                        }}>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.hasQuiz ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-300'}`}>
                                {formData.hasQuiz && <FaCheck size={12} />}
                            </div>
                            <span className="text-sm font-bold text-gray-700 select-none">Link Chapter Practice Quiz?</span>
                        </div>

                        {formData.hasQuiz && (
                            <div className="ml-7 animate-in fade-in slide-in-from-top-2">
                                {/* Manual Entry First - Full Control */}
                                <div className="mb-2">
                                    <label className="text-[10px] text-gray-500 font-bold block mb-1">ENTER EXACT QUIZ CHAPTER NAME</label>
                                    <input
                                        name="linkedQuizChapter"
                                        value={formData.linkedQuizChapter}
                                        onChange={handleChange}
                                        placeholder="Type name exactly as in Question Bank..."
                                        className="w-full p-2 border border-purple-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-purple-500/20 outline-none font-bold text-gray-700"
                                    />
                                </div>

                                {availableChapters.length > 0 && (
                                    <div className="mb-2">
                                        <label className="text-[10px] text-gray-400 block mb-1">Or pick from available chapters:</label>
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    setFormData({ ...formData, linkedQuizChapter: e.target.value });
                                                }
                                            }}
                                            className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 text-xs text-gray-600 outline-none cursor-pointer hover:bg-white transition-colors"
                                            value=""
                                        >
                                            <option value="">-- Helper List (Click to Auto-Fill) --</option>
                                            {availableChapters.map((chap, idx) => (
                                                <option key={idx} value={chap.name}>
                                                    {chap.name} ({chap.count} Qs)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                                    <span className="text-purple-600 font-bold">Note:</span> This must match the Chapter Name in your Question Bank exactly.
                                </p>
                            </div>
                        )}
                    </div>



                    {/* Video Details */}
                    <input
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Video Title"
                        className="p-3 border rounded-xl bg-gray-50 outline-none md:col-span-2"
                        required
                    />

                    <div className="md:col-span-2 space-y-2">
                        <div className="flex gap-2">
                            <input
                                name="videoUrl"
                                value={formData.videoUrl}
                                onChange={handleChange}
                                placeholder="YouTube URL (e.g. https://youtu.be/...)"
                                className="flex-1 p-3 border rounded-xl bg-gray-50 outline-none font-mono text-sm"
                                required
                            />
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!formData.videoUrl) return toast.error('Enter URL first');
                                    const toastId = toast.loading('Fetching details...');
                                    try {
                                        const res = await fetch(`/api/youtube/metadata?url=${encodeURIComponent(formData.videoUrl)}`);
                                        const data = await res.json();
                                        if (data.error) throw new Error(data.error);

                                        setFormData(prev => ({
                                            ...prev,
                                            title: data.title || '',
                                            channelName: data.channelName || '',
                                            teacherName: data.channelName || '', // Default teacher to channel
                                            views: data.views || 0 // Set initial views from YouTube
                                        }));
                                        toast.success(`Found: ${data.views?.toLocaleString()} views!`, { id: toastId });
                                    } catch (err) {
                                        toast.error('Could not fetch details', { id: toastId });
                                    }
                                }}
                                className="px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-bold hover:bg-gray-900 transition-colors"
                            >
                                Auto-Fill 🪄
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 pl-1">
                            Click Auto-Fill to detect Title & Channel automatically.
                        </p>
                    </div>

                    {/* Credits */}
                    <div className="md:col-span-2 bg-yellow-50 p-4 rounded-xl border border-yellow-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <p className="md:col-span-2 text-xs font-bold text-yellow-700 uppercase tracking-widest flex items-center gap-2">
                            <FaExclamationTriangle /> Creator Credits (Mandatory)
                        </p>
                        <input
                            name="teacherName"
                            value={formData.teacherName}
                            onChange={handleChange}
                            placeholder="Teacher Name"
                            className="p-3 border border-yellow-200 rounded-xl bg-white outline-none"
                            required
                        />
                        <input
                            name="channelName"
                            value={formData.channelName}
                            onChange={handleChange}
                            placeholder="YouTube Channel Name"
                            className="p-3 border border-yellow-200 rounded-xl bg-white outline-none"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="md:col-span-2 bg-pw-indigo text-white py-3 rounded-xl font-bold hover:bg-pw-violet transition-colors disabled:opacity-50"
                    >
                        {submitting ? 'Adding...' : 'Add Video Resource'}
                    </button>
                </form>
            </div>

            {/* Video List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">Existing Resources ({videos.length})</h3>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading resources...</div>
                ) : (
                    <div className="divide-y">
                        {videos.map(video => (
                            <div key={video.id} className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center hover:bg-gray-50 transition-colors">
                                <img
                                    src={video.thumbnailUrl}
                                    className="w-32 h-20 object-cover rounded-lg bg-gray-200"
                                    alt="thumb"
                                />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-800 truncate">{video.title}</h4>
                                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-bold uppercase">{video.board}</span>
                                        <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100 font-bold">Class {video.classLevel}</span>
                                        <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100 font-bold">{video.subject}</span>
                                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">{video.chapter}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Credit: {video.teacherName} ({video.channelName})
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(video.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Resource"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
