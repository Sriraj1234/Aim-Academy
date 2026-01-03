'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { FaPlus, FaTrash, FaPuzzlePiece, FaSpinner } from 'react-icons/fa';
import { MediaUploader } from '@/components/admin/MediaUploader';

export default function MindGameAdminPage() {
    const [puzzles, setPuzzles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [imageUrl, setImageUrl] = useState('');

    useEffect(() => {
        fetchPuzzles();
    }, []);

    const fetchPuzzles = async () => {
        try {
            const q = query(collection(db, 'mind_games'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            setPuzzles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching puzzles:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageUrl || !title) return;

        setUploading(true);
        try {
            // 2. Save Metadata (Image already uploaded via Cloudinary)
            await addDoc(collection(db, 'mind_games'), {
                title,
                difficulty,
                imageUrl: imageUrl,
                isActive: true,
                createdAt: serverTimestamp()
            });

            // 3. Reset Form & Refresh
            setTitle('');
            setImageUrl('');
            fetchPuzzles();
            alert('Puzzle added successfully!');
        } catch (error) {
            console.error("Error adding puzzle:", error);
            alert('Failed to add puzzle.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this puzzle?')) return;
        try {
            await deleteDoc(doc(db, 'mind_games', id));
            setPuzzles(puzzles.filter(p => p.id !== id));
        } catch (error) {
            console.error("Error deleting puzzle:", error);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto font-sans">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <FaPuzzlePiece className="text-purple-600" />
                    Mind Game Manager
                </h1>
                <p className="text-gray-500">Manage 'Image Fix' puzzles for brain warmup.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add New Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <FaPlus className="text-purple-500" /> Add New Puzzle
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Puzzle Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Scenery, Geometry, etc."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty</label>
                                <select
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value as any)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none bg-white"
                                >
                                    <option value="easy">Easy (10 Moves)</option>
                                    <option value="medium">Medium (30 Moves)</option>
                                    <option value="hard">Hard (80 Moves)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Reference Image</label>
                                <MediaUploader
                                    folder="mind_games"
                                    onUploadSuccess={(url) => setImageUrl(url)}
                                />
                                {imageUrl && (
                                    <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                        <FaPuzzlePiece /> Image Ready
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={uploading || !imageUrl}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {uploading ? <FaSpinner className="animate-spin" /> : 'Create Puzzle'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Puzzle List */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[500px]">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Active Puzzles ({puzzles.length})</h2>

                        {loading ? (
                            <div className="flex justify-center p-12"><FaSpinner className="animate-spin text-purple-600 text-2xl" /></div>
                        ) : puzzles.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <p>No puzzles added yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {puzzles.map((puzzle) => (
                                    <div key={puzzle.id} className="relative group bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                                        <div className="aspec-video h-40 bg-gray-200">
                                            <img src={puzzle.imageUrl} alt={puzzle.title} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-800">{puzzle.title}</h3>
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${puzzle.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                                    puzzle.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {puzzle.difficulty}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(puzzle.id)}
                                                className="absolute top-2 right-2 bg-white/90 text-red-500 p-2 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
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
    );
}
