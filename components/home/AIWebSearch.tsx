'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaGlobe, FaTimes, FaExternalLinkAlt, FaSpinner, FaImage } from 'react-icons/fa';

interface SearchResult {
    title: string;
    description?: string;
    url: string;
    displayLink?: string;
    image?: string;
    thumbnail?: string;
}

export const AIWebSearch = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'text' | 'image'>('text');

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setResults([]);

        try {
            const res = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, type: mode })
            });
            const data = await res.json();
            if (data.results) {
                setResults(data.results);
            }
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Trigger Card - Designed for Grid */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(true)}
                className="w-full h-full min-h-[120px] bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl p-5 text-white shadow-lg shadow-cyan-500/20 flex flex-col items-start justify-between group overflow-hidden relative"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <FaGlobe className="text-6xl" />
                </div>

                <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur-sm">
                    <FaSearch className="text-xl" />
                </div>

                <div className="text-left z-10">
                    <h3 className="font-bold text-lg leading-tight">Smart Search</h3>
                    <p className="text-xs text-white/80 mt-1">Instant definitions & diagrams</p>
                </div>
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-4 border-b flex items-center gap-3 bg-gray-50">
                                <div className="p-2 bg-cyan-100 text-cyan-600 rounded-lg">
                                    <FaGlobe />
                                </div>
                                <h2 className="font-bold text-gray-800">AI Web Search</h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="ml-auto w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full text-gray-500"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            {/* Search Bar */}
                            <div className="p-4 border-b bg-white relative z-10">
                                <form onSubmit={handleSearch} className="flex gap-2">
                                    <div className="relative flex-1">
                                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder="Search for definitions, diagrams..."
                                            className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium text-gray-700"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex bg-gray-100 rounded-xl p-1">
                                        <button
                                            type="button"
                                            onClick={() => setMode('text')}
                                            className={`px-3 rounded-lg text-sm font-bold transition-all ${mode === 'text' ? 'bg-white shadow-sm text-cyan-600' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            Text
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMode('image')}
                                            className={`px-3 rounded-lg text-sm font-bold transition-all flex items-center gap-1 ${mode === 'image' ? 'bg-white shadow-sm text-cyan-600' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            <FaImage /> Img
                                        </button>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading || !query.trim()}
                                        className="bg-cyan-600 text-white px-6 rounded-xl font-bold hover:bg-cyan-700 disabled:opacity-50 transition-colors"
                                    >
                                        {loading ? <FaSpinner className="animate-spin" /> : 'Go'}
                                    </button>
                                </form>
                            </div>

                            {/* Results */}
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 min-h-[300px]">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
                                        <FaSpinner className="text-3xl animate-spin text-cyan-500" />
                                        <p className="text-sm font-medium">Searching the web...</p>
                                    </div>
                                ) : results.length > 0 ? (
                                    <div className={mode === 'image' ? 'grid grid-cols-2 sm:grid-cols-3 gap-3' : 'space-y-3'}>
                                        {results.map((result, idx) => (
                                            <div key={idx} className={`group relative bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-all ${mode === 'text' ? 'p-4' : ''}`}>
                                                {mode === 'image' ? (
                                                    // Image Result
                                                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="block aspect-square relative">
                                                        <img
                                                            src={result.thumbnail || result.image || result.url}
                                                            alt={result.title}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Preview';
                                                            }}
                                                        />
                                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <p className="text-white text-xs truncate">{result.title}</p>
                                                        </div>
                                                    </a>
                                                ) : (
                                                    // Text Result
                                                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-1">
                                                        <h3 className="font-bold text-blue-600 group-hover:underline line-clamp-1">{result.title}</h3>
                                                        <p className="text-sm text-green-700 truncate text-xs mb-1">{new URL(result.url).hostname}</p>
                                                        <p className="text-sm text-gray-600 line-clamp-2">{result.description}</p>
                                                        <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                                                            Visit Source <FaExternalLinkAlt />
                                                        </div>
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                            <FaSearch className="text-2xl opacity-20" />
                                        </div>
                                        <p className="text-sm">Search for anything to help your studies</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
