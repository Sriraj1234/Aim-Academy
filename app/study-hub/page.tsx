'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { VideoResource } from '@/data/types';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaFilter, FaPlay, FaExclamationCircle, FaEye, FaCheck, FaBolt, FaYoutube } from 'react-icons/fa';
import { HiOutlineAcademicCap } from 'react-icons/hi2';
import { StudyHubBanner } from '@/components/study-hub/StudyHubBanner';

// Filter constants
const BOARDS = [
    { id: 'cbse', name: 'CBSE' },
    { id: 'icse', name: 'ICSE' },
    { id: 'bseb', name: 'Bihar Board' },
    { id: 'up', name: 'UP Board' },
];

const CLASSES = ['9', '10', '11', '12'];

const SUBJECT_ICONS: Record<string, string> = {
    'Physics': '⚛️',
    'Chemistry': '🧪',
    'Biology': '🧬',
    'Math': '📐',
    'History': '📜',
    'Geography': '🌍',
    'English': '📚',
    'Hindi': '🕉️'
};

export default function StudyHubPage() {
    const { userProfile, user } = useAuth();
    const [videos, setVideos] = useState<VideoResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState<VideoResource | null>(null);
    const [completedVideoIds, setCompletedVideoIds] = useState<Set<string>>(new Set());

    // Filters
    const [selectedBoard, setSelectedBoard] = useState(userProfile?.board?.toLowerCase() || 'cbse');
    const [selectedClass, setSelectedClass] = useState(userProfile?.class || '10');
    const [selectedSubject, setSelectedSubject] = useState<string | 'All'>('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchVideos = async () => {
            setLoading(true);
            try {
                // Base Query
                const resourcesRef = collection(db, 'video_resources');
                let q = query(
                    resourcesRef,
                    where('board', '==', selectedBoard),
                    where('classLevel', '==', selectedClass),
                    orderBy('views', 'desc'), // Sort by Popularity
                    orderBy('createdAt', 'desc')
                );

                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoResource));
                setVideos(data);
            } catch (error) {
                console.error("Error fetching videos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, [selectedBoard, selectedClass]);

    // Fetch Completed Videos
    useEffect(() => {
        if (!user) return;

        // Real-time listener for completions
        const unsubscribe = onSnapshot(collection(db, `users/${user.uid}/completed_videos`), (snapshot) => {
            const ids = new Set(snapshot.docs.map(doc => doc.id));
            setCompletedVideoIds(ids);
        });

        return () => unsubscribe();
    }, [user]);

    // View Tracking Handler - Call API to increment view + update history
    const handleVideoClick = async (video: VideoResource) => {
        setSelectedVideo(video);

        try {
            // Call API to increment views securely
            fetch('/api/study-hub/view', {
                method: 'POST',
                body: JSON.stringify({ videoId: video.id, userId: userProfile?.uid })
            });
        } catch (e) {
            console.error("View track error", e);
        }
    };

    const toggleCompletion = async (e: React.MouseEvent, videoId: string) => {
        e.stopPropagation();
        if (!user) return;

        const isCompleted = completedVideoIds.has(videoId);
        const ref = doc(db, `users/${user.uid}/completed_videos`, videoId);

        try {
            if (isCompleted) {
                await deleteDoc(ref);
                // State update handled by onSnapshot
            } else {
                await setDoc(ref, {
                    videoId,
                    completedAt: serverTimestamp(),
                    board: selectedBoard,
                    class: selectedClass
                });
                // State update handled by onSnapshot
            }
        } catch (error) {
            console.error("Error toggling completion:", error);
        }
    };

    // Derived Data
    const subjects = Array.from(new Set(videos.map(v => v.subject)));

    const filteredVideos = videos.filter(v => {
        const matchesSubject = selectedSubject === 'All' || v.subject === selectedSubject;
        const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.chapter.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSubject && matchesSearch;
    });

    // Group by Chapter
    const videosByChapter = filteredVideos.reduce((acc, video) => {
        if (!acc[video.chapter]) acc[video.chapter] = [];
        acc[video.chapter].push(video);
        return acc;
    }, {} as Record<string, VideoResource[]>);

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* Banner Section */}
            <div className="max-w-7xl mx-auto px-4 py-4 pt-6">
                <StudyHubBanner />
            </div>

            {/* Sticky Header (Filters & Tabs) */}
            <div className="bg-white border-b sticky top-16 md:top-0 z-30 shadow-sm transition-all">
                <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
                    <div className="w-full">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="text-left">
                                <h2 className="text-lg md:text-xl font-bold text-gray-900">Browse Resources</h2>
                                <p className="text-xs md:text-sm text-gray-500 font-medium text-left">Curated content for <span className="text-pw-indigo font-bold">{BOARDS.find(b => b.id === selectedBoard)?.name}</span> • Class {selectedClass}</p>
                            </div>

                            <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                <select
                                    value={selectedBoard}
                                    onChange={(e) => setSelectedBoard(e.target.value)}
                                    className="flex-1 md:flex-none px-3 py-2 bg-gray-100 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-pw-indigo/20 text-left"
                                >
                                    {BOARDS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>

                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="flex-1 md:flex-none px-3 py-2 bg-gray-100 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-pw-indigo/20 text-left"
                                >
                                    {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Subject Tabs */}
                    <div className="flex gap-2 mt-3 md:mt-4 overflow-x-auto pb-2 scrollbar-hide w-full">
                        <button
                            onClick={() => setSelectedSubject('All')}
                            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all ${selectedSubject === 'All'
                                ? 'bg-pw-indigo text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            All Subjects
                        </button>
                        {subjects.map(subj => (
                            <button
                                key={subj}
                                onClick={() => setSelectedSubject(subj)}
                                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${selectedSubject === subj
                                    ? 'bg-pw-indigo text-white shadow-md'
                                    : 'bg-white border text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <span>{SUBJECT_ICONS[subj] || SUBJECT_ICONS[subj.charAt(0).toUpperCase() + subj.slice(1)] || '📚'}</span>
                                {subj}
                            </button>
                        ))}
                    </div>
                </div>
            </div>


            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
                {/* Search */}
                <div className="relative mb-6 md:mb-8 max-w-md mx-auto">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search chapter or topic..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-pw-indigo/20 outline-none transition-all placeholder-gray-400 text-sm md:text-base text-left"
                    />
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="w-8 h-8 border-2 border-pw-indigo border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-sm font-medium">Loading trusted resources...</p>
                    </div>
                ) : Object.keys(videosByChapter).length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 text-2xl">
                            <HiOutlineAcademicCap />
                        </div>
                        <h3 className="text-gray-900 font-bold mb-1">No videos found</h3>
                        <p className="text-gray-500 text-sm">Try changing filters or searching for something else.</p>
                    </div>
                ) : (
                    <div className="space-y-8 md:space-y-12">
                        {Object.entries(videosByChapter).map(([chapter, chapterVideos]) => (
                            <div key={chapter}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-px flex-1 bg-gray-200" />
                                    <h2 className="text-sm md:text-lg font-bold text-gray-800 uppercase tracking-wider px-3 md:px-2 border border-gray-200 rounded-lg py-1 bg-white shadow-sm text-center">
                                        {chapter}
                                    </h2>
                                    <div className="h-px flex-1 bg-gray-200" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                    {chapterVideos.map(video => (
                                        <div
                                            key={video.id}
                                            className={`group bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ${completedVideoIds.has(video.id) ? 'border-green-200 ring-1 ring-green-100' : 'border-gray-100'}`}
                                            onClick={() => handleVideoClick(video)}
                                        >
                                            {/* Thumbnail */}
                                            <div className="relative aspect-video bg-gray-900">
                                                <img
                                                    src={video.thumbnailUrl}
                                                    alt={video.title}
                                                    className={`w-full h-full object-cover transition-opacity ${completedVideoIds.has(video.id) ? 'opacity-75' : 'opacity-90 group-hover:opacity-100'}`}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg scale-90 group-hover:scale-100 transition-transform">
                                                        <FaPlay className="ml-1" />
                                                    </div>
                                                </div>

                                                {/* STATUS BADGES */}
                                                <div className="absolute top-2 right-2 flex gap-1">
                                                    {completedVideoIds.has(video.id) && (
                                                        <div className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                                                            <FaCheck /> Done
                                                        </div>
                                                    )}
                                                    {video.hasQuiz && (
                                                        <div className="bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                                                            <FaBolt /> Quiz
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="p-4">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                        {video.subject}
                                                    </span>
                                                </div>
                                                <h3 className={`font-bold text-gray-800 line-clamp-2 leading-tight mb-3 h-10 ${completedVideoIds.has(video.id) ? 'text-gray-500' : ''}`}>
                                                    {video.title}
                                                </h3>

                                                {/* Credits Container */}
                                                <div className="bg-gray-50 rounded-xl p-2.5 flex items-center gap-3 border border-gray-100">
                                                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 text-xs shadow-sm">
                                                        <FaYoutube />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-gray-900 truncate">{video.teacherName}</p>
                                                        <p className="text-[10px] text-gray-500 truncate">{video.channelName}</p>
                                                    </div>
                                                </div>

                                                <div className="mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-400 text-center flex items-center justify-center gap-1">
                                                    Video credit belongs to the respective creator
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Video Modal */}
            <AnimatePresence>
                {selectedVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
                        onClick={() => setSelectedVideo(null)}
                    >
                        <div className="w-full max-w-4xl bg-black rounded-3xl overflow-hidden shadow-2xl relative border border-gray-800" onClick={e => e.stopPropagation()}>
                            <div className="aspect-video">
                                <iframe
                                    className="w-full h-full"
                                    src={`https://www.youtube.com/embed/${selectedVideo?.videoId}?autoplay=1&rel=0`}
                                    title={selectedVideo?.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                            <div className="p-4 bg-gray-900 text-white flex flex-col md:flex-row justify-between items-start gap-4">
                                <div>
                                    <h3 className="font-bold text-lg mb-1">{selectedVideo?.title}</h3>
                                    <p className="text-sm text-gray-400 mb-4">
                                        By <span className="text-white font-bold">{selectedVideo?.teacherName}</span> • {selectedVideo?.channelName} • {selectedVideo?.views || 0} views
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-3">
                                    {/* Mark as Complete Button */}
                                    <button
                                        onClick={(e) => selectedVideo && toggleCompletion(e, selectedVideo.id)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${selectedVideo && completedVideoIds.has(selectedVideo.id)
                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                            : 'bg-white/10 hover:bg-white/20 text-gray-300'
                                            }`}
                                    >
                                        {selectedVideo && completedVideoIds.has(selectedVideo.id) ? (
                                            <>
                                                <FaCheck /> Completed
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-4 h-4 rounded-full border-2 border-current" /> Mark as Done
                                            </>
                                        )}
                                    </button>

                                    {/* Link with updated HREF logic for better safety */}
                                    {selectedVideo?.hasQuiz && (
                                        <a
                                            href={`/play/selection?mode=chapter&board=${selectedVideo?.board}&class=${selectedVideo?.classLevel}&subject=${selectedVideo?.subject}&chapter=${encodeURIComponent(selectedVideo?.linkedQuizChapter || selectedVideo?.chapter || '')}`}
                                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-sm font-bold transition-all flex items-center gap-2 animate-pulse"
                                        >
                                            <FaBolt /> Take Quiz
                                        </a>
                                    )}

                                    <button
                                        onClick={() => setSelectedVideo(null)}
                                        className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fixed Legal Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 py-2 px-4 text-center z-10">
                <p className="text-[10px] text-gray-500 font-medium flex items-center justify-center gap-1.5 container mx-auto">
                    <FaExclamationCircle className="text-gray-400" />
                    All videos are sourced from YouTube for educational reference only. We do not own or claim any content. Full credit goes to respective creators.
                    <a href="#" className="ml-2 text-gray-400 underline hover:text-gray-600">Content Removal Request</a>
                </p>
            </div>
        </div >
    );
}
