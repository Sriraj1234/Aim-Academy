'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import { FaYoutube, FaTrash, FaEdit, FaPlus, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { VideoResource } from '@/data/types';
import { toast } from 'react-hot-toast';

export default function StudyHubAdmin() {
    const { user } = useAuth();
    const [videos, setVideos] = useState<VideoResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        videoUrl: '',
        board: 'cbse',
        classLevel: '10',
        subject: 'Physics',
        chapter: '',
        teacherName: '',
        channelName: ''
    });

    // YouTube Parser
    const extractVideoID = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

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
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
            setFormData({ ...formData, title: '', videoUrl: '', chapter: '' }); // Reset partial
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

                    {/* Video Details */}
                    <input
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Video Title"
                        className="p-3 border rounded-xl bg-gray-50 outline-none md:col-span-2"
                        required
                    />

                    <input
                        name="videoUrl"
                        value={formData.videoUrl}
                        onChange={handleChange}
                        placeholder="YouTube URL (e.g. https://youtu.be/...)"
                        className="p-3 border rounded-xl bg-gray-50 outline-none md:col-span-2 font-mono text-sm"
                        required
                    />

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
