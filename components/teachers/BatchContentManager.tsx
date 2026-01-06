'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { FaTrash, FaYoutube, FaVideo, FaPlus, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface ClassItem {
    id: string;
    title: string;
    videoUrl: string;
    type: 'live' | 'recorded';
    createdAt: any;
}

interface BatchContentManagerProps {
    batchId: string;
    batchName: string;
    onClose: () => void;
}

export default function BatchContentManager({ batchId, batchName, onClose }: BatchContentManagerProps) {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    // New Class State
    const [title, setTitle] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [type, setType] = useState<'live' | 'recorded'>('recorded');

    useEffect(() => {
        const q = query(
            collection(db, 'batches', batchId, 'classes'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ClassItem));
            setClasses(items);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [batchId]);

    const handleAddClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !videoUrl.trim()) return;

        setAdding(true);
        try {
            await addDoc(collection(db, 'batches', batchId, 'classes'), {
                title: title.trim(),
                videoUrl: videoUrl.trim(),
                type,
                createdAt: serverTimestamp()
            });
            toast.success('Class added successfully!');
            setTitle('');
            setVideoUrl('');
            setType('recorded');
        } catch (error) {
            console.error(error);
            toast.error('Failed to add class');
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteClass = async (classId: string) => {
        if (!confirm('Delete this class?')) return;
        try {
            await deleteDoc(doc(db, 'batches', batchId, 'classes', classId));
            toast.success('Class deleted');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete class');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Manage Content</h2>
                    <p className="text-sm text-gray-500">{batchName}</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Add New Class Form */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <FaPlus className="text-brand-600" /> Add New Class
                    </h3>
                    <form onSubmit={handleAddClass} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Class Title (e.g. Lecture 1: Algebra)"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex gap-4">
                            <input
                                type="url"
                                placeholder="YouTube Video URL"
                                className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                value={videoUrl}
                                onChange={e => setVideoUrl(e.target.value)}
                                required
                            />
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as any)}
                                className="p-2 border rounded-lg bg-white outline-none"
                            >
                                <option value="recorded">Recorded</option>
                                <option value="live">Live Stream</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={adding}
                            className="w-full bg-brand-600 text-white py-2 rounded-lg font-semibold hover:bg-brand-700 transition flex items-center justify-center gap-2"
                        >
                            {adding ? <FaSpinner className="animate-spin" /> : 'Add Class'}
                        </button>
                    </form>
                </div>

                {/* Class List */}
                <div>
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <FaVideo className="text-gray-500" />
                        Classes ({classes.length})
                    </h3>

                    {loading ? (
                        <div className="text-center py-8 text-gray-400"><FaSpinner className="animate-spin text-2xl mx-auto" /></div>
                    ) : classes.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-xl">
                            No classes added yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {classes.map(item => (
                                <div key={item.id} className="bg-white border rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${item.type === 'live' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {item.type === 'live' ? <FaYoutube /> : <FaVideo />}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-medium text-gray-800 truncate">{item.title}</h4>
                                            <a href={item.videoUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline truncate block">
                                                {item.videoUrl}
                                            </a>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteClass(item.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
