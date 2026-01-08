'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, query, where, limit, doc, getDoc, orderBy, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createRoom, updateRoomConfig } from '@/utils/roomService';
import { FaBook, FaLayerGroup, FaPlay, FaSpinner, FaArrowLeft, FaCheckCircle, FaFlask, FaGlobeAmericas, FaLanguage, FaCalculator, FaTimes, FaSave, FaCrown } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';

// Force dynamic rendering to fix build error with useSearchParams
export const dynamic = 'force-dynamic';

interface CategoryData {
    subjects: string[]
    chapters: Record<string, { name: string; count: number }[]>
}

const subjectIcons: Record<string, any> = {
    science: FaFlask,
    math: FaCalculator,
    sst: FaGlobeAmericas,
    hindi: FaLanguage,
    english: FaBook
};

// Reuse Customize Modal (Should be shared component in future)
function CustomizeModal({
    totalCount,
    chapterName,
    onConfirm,
    onClose
}: {
    totalCount: number,
    chapterName: string,
    onConfirm: (count: number) => void,
    onClose: () => void
}) {
    // Generate Options
    const baseOptions = [20, 40, 60, 80, 100];
    const options = baseOptions.filter(opt => opt < totalCount);
    // Always append "All" (which is totalCount)
    options.push(totalCount);
    // Remove duplicates
    const uniqueOptions = Array.from(new Set(options));

    const [selected, setSelected] = useState<number>(options[0] || totalCount);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-pw-xl border border-pw-border"
            >
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-pw-violet">Customize Quiz</h3>
                        <p className="text-sm text-gray-500">{chapterName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-pw-surface rounded-full text-gray-400 hover:text-pw-violet transition-colors">
                        <FaTimes size={16} />
                    </button>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-3">Number of Questions</label>
                    <div className="grid grid-cols-3 gap-3">
                        {uniqueOptions.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => setSelected(opt)}
                                className={`
                                    py-2 px-3 rounded-xl text-sm font-bold transition-all border
                                    ${selected === opt
                                        ? 'border-pw-indigo bg-pw-indigo/5 text-pw-indigo shadow-sm'
                                        : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'}
                                `}
                            >
                                {opt === totalCount ? `All (${opt})` : opt}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => onConfirm(selected)}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pw-indigo to-pw-violet text-white font-bold text-lg hover:shadow-pw-lg hover:-translate-y-0.5 transition-all shadow-pw-md"
                >
                    Confirm & Proceed
                </button>
            </motion.div>
        </div>
    )
}


function HostGameContent() {
    const router = useRouter();
    const { user, userProfile } = useAuth();
    const [step, setStep] = useState<'subject' | 'chapter' | 'confirm'>('subject');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedChapter, setSelectedChapter] = useState('');
    const [selectedCount, setSelectedCount] = useState<number>(20); // Default
    const searchParams = useSearchParams();
    const existingRoomId = searchParams.get('existingRoomId');
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<CategoryData>({ subjects: [], chapters: {} });
    // Customization Modal State
    const [customizing, setCustomizing] = useState<{ name: string, count: number } | null>(null);

    // ... (rest of state)

    useEffect(() => {
        const fetchMetadata = async () => {
            let data: any = null;
            // 1. Try fetching standard Taxonomy (Board + Class)
            console.log("Fetching taxonomy from metadata/taxonomy...");
            try {
                const docRef = doc(db, 'metadata', 'taxonomy');
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const fullData = docSnap.data();
                    console.log("Full Taxonomy Data:", fullData);

                    // Determine Key: e.g. "cbse_10"
                    const board = userProfile?.board || 'cbse';
                    const userClass = userProfile?.class || '10';
                    const key = `${board}_${userClass}`;

                    console.log(`Looking for key: ${key}`);

                    let targetData = fullData[key];

                    // Fallback: If key not found, try to find ANY key that looks like data, or root
                    if (!targetData) {
                        if (fullData.subjects) targetData = fullData; // Root level fallback
                        else {
                            // Try first available key
                            const firstKey = Object.keys(fullData)[0];
                            if (firstKey) targetData = fullData[firstKey];
                        }
                    }

                    if (targetData && targetData.subjects) {
                        setCategories({
                            subjects: targetData.subjects,
                            chapters: targetData.chapters || {}
                        });
                        return; // Success!
                    }
                }
            } catch (e) {
                console.error("Standard fetch failed:", e);
            }

            // 2. Fallback: Dynamic Scan (Backup)
            console.warn("Metadata key missing or fetch failed. Scanning 'questions' collection...");
            console.warn("No metadata found. Scanning 'questions' collection dynamically...");
            try {
                const qSnap = await getDocs(query(collection(db, 'questions'), limit(500)));

                const subjectsSet = new Set<string>();
                const chaptersMap: Record<string, { name: string; count: number }[]> = {};
                const chapterCounts: Record<string, Record<string, number>> = {};

                qSnap.forEach(doc => {
                    const d = doc.data();
                    if (d.subject) {
                        const sub = d.subject.toLowerCase(); // Normalize
                        subjectsSet.add(sub);

                        if (d.chapter) {
                            if (!chapterCounts[sub]) chapterCounts[sub] = {};
                            if (!chapterCounts[sub][d.chapter]) chapterCounts[sub][d.chapter] = 0;
                            chapterCounts[sub][d.chapter]++;
                        }
                    }
                });

                // Build data structure
                data = {
                    subjects: Array.from(subjectsSet),
                    chapters: {}
                };

                Object.keys(chapterCounts).forEach(sub => {
                    data.chapters[sub] = Object.keys(chapterCounts[sub]).map(chapName => ({
                        name: chapName,
                        count: chapterCounts[sub][chapName]
                    }));
                });

                console.log("Scanned Data:", data);

            } catch (scanErr) {
                console.error("Scanning failed:", scanErr);
                // Absolute Fallback
                data = {
                    subjects: ["science", "math"],
                    chapters: { "science": [], "math": [] }
                };
            }

            const validSubjects = (data.subjects || []).filter((s: string) => s !== 'All');

            setCategories({
                subjects: validSubjects,
                chapters: data.chapters || {}
            });
        };

        fetchMetadata();
    }, []);

    const handleCreate = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            const qRef = collection(db, 'questions');
            let q: any;

            // NEW: Randomize by picking a random start point
            const randomId = doc(collection(db, 'questions')).id;
            const constraints: any[] = [];

            // 1. Isolation Filters (Board & Class)
            if (userProfile?.board) {
                constraints.push(where('board', '==', userProfile.board.toLowerCase()));
            }
            if (userProfile?.class) {
                // Handle both string/number variance
                constraints.push(where('class', 'in', [String(userProfile.class), Number(userProfile.class)]));
            }

            if (selectedChapter && selectedChapter !== 'All Mixed') {
                constraints.push(where('subject', '==', selectedSubject));
                constraints.push(where('chapter', '==', selectedChapter));
            } else {
                constraints.push(where('subject', '==', selectedSubject));
            }

            // Add Random Cursor + Limit
            const randomConstraints = [...constraints, where(documentId(), '>=', randomId), orderBy(documentId()), limit(selectedCount)];

            q = query(qRef, ...randomConstraints);
            const snap = await getDocs(q);
            let questions = snap.docs.map(d => ({ id: d.id, ...(d.data() as object) }));

            // Wrap around if not enough
            if (questions.length < selectedCount) {
                const remaining = selectedCount - questions.length;
                console.log(`Host Game: Hit end, wrapping for ${remaining}...`);
                const wrapConstraints = [...constraints, where(documentId(), '>=', ' '), orderBy(documentId()), limit(remaining)];
                const wrapQuery = query(qRef, ...wrapConstraints);
                const wrapSnap = await getDocs(wrapQuery);

                wrapSnap.forEach(d => {
                    if (!questions.some(exist => exist.id === d.id)) {
                        questions.push({ id: d.id, ...(d.data() as object) });
                    }
                });
            }

            if (questions.length === 0) {
                alert("No questions found for this selection!");
                setIsLoading(false);
                return;
            }

            // Shuffle client side
            questions = questions.sort(() => 0.5 - Math.random());

            if (existingRoomId) {
                // UPDATE Existing Room
                await updateRoomConfig(existingRoomId, selectedSubject, selectedChapter || 'All', questions);
                router.push(`/play/group/lobby/${existingRoomId}`);
            } else {
                // CREATE New Room
                const hostName = user.displayName || 'Host';
                const { roomId } = await createRoom(hostName, selectedSubject, selectedChapter || 'All', questions, user.uid, user.photoURL || undefined);

                localStorage.setItem(`room_host_${roomId}`, 'true');
                localStorage.setItem(`player_name_${roomId}`, hostName);
                localStorage.setItem(`player_id_${roomId}`, user.uid);

                router.push(`/play/group/lobby/${roomId}`);
            }

        } catch (error: any) {
            console.error(error);
            alert(`Failed to configure room: ${error.message || "Unknown error"}`);
            setIsLoading(false);
        }
    };

    const handleChapterClick = (chapName: string, total: number) => {
        setCustomizing({ name: chapName, count: total });
    };

    const handleConfirmCustomization = (count: number) => {
        if (customizing) {
            setSelectedChapter(customizing.name);
            setSelectedCount(count);
            setCustomizing(null);
            setStep('confirm');
        }
    };

    const handleBack = () => {
        if (step === 'chapter') setStep('subject');
        else if (step === 'confirm') setStep('chapter');
        else router.push('/play/group');
    }

    return (
        <div className="min-h-screen bg-pw-surface px-6 py-8 flex flex-col items-center relative overflow-hidden font-sans">

            <AnimatePresence>
                {customizing && (
                    <CustomizeModal
                        totalCount={customizing.count}
                        chapterName={customizing.name}
                        onConfirm={handleConfirmCustomization}
                        onClose={() => setCustomizing(null)}
                    />
                )}
            </AnimatePresence>

            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 left-20 w-80 h-80 bg-pw-indigo/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-20 right-20 w-80 h-80 bg-pw-violet/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">

                {/* Left Column: Navigation & Settings Card */}
                <div className="lg:col-span-4 space-y-6">
                    <button onClick={handleBack} className="flex items-center gap-2 text-gray-500 hover:text-pw-indigo transition-colors font-bold px-4">
                        <FaArrowLeft /> Back
                    </button>

                    <motion.div layoutId="config-card" className="bg-white rounded-[2rem] p-8 shadow-pw-lg border border-pw-border sticky top-8">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-10 h-10 rounded-full bg-pw-indigo/10 text-pw-indigo flex items-center justify-center">
                                <FaCrown />
                            </span>
                            <h2 className="text-2xl font-display font-bold text-pw-violet">Host Game</h2>
                        </div>

                        {/* Step Indicators */}
                        <div className="flex items-center gap-2 mb-8 bg-pw-surface p-1.5 rounded-full">
                            {['subject', 'chapter', 'confirm'].map((s, i) => (
                                <div key={s} className={`h-2 flex-1 rounded-full transition-all duration-500 ${['subject', 'chapter', 'confirm'].indexOf(step) >= i
                                    ? 'bg-gradient-to-r from-pw-indigo to-pw-violet shadow-sm'
                                    : 'bg-gray-200'
                                    }`} />
                            ))}
                        </div>

                        {/* Selected Data */}
                        <div className="space-y-4">
                            <div className={`p-4 rounded-xl border transition-all ${selectedSubject ? 'bg-pw-indigo/5 border-pw-indigo/20' : 'bg-gray-50 border-transparent'}`}>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Subject</p>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedSubject ? 'bg-white text-pw-indigo shadow-sm' : 'bg-gray-200 text-gray-400'}`}>
                                        <FaBook size={16} />
                                    </div>
                                    <p className={`font-bold capitalize text-lg ${selectedSubject ? 'text-pw-violet' : 'text-gray-400'}`}>
                                        {selectedSubject || 'Select Subject'}
                                    </p>
                                </div>
                            </div>

                            <div className={`p-4 rounded-xl border transition-all ${selectedChapter ? 'bg-pw-violet/5 border-pw-violet/20' : 'bg-gray-50 border-transparent'}`}>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Chapter</p>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedChapter ? 'bg-white text-pw-violet shadow-sm' : 'bg-gray-200 text-gray-400'}`}>
                                        <FaLayerGroup size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className={`font-bold leading-tight ${selectedChapter ? 'text-pw-violet' : 'text-gray-400'}`}>
                                            {selectedChapter || (selectedSubject && !selectedChapter ? 'Select Chapter' : 'Waiting...')}
                                        </p>
                                        {selectedChapter && <p className="text-xs text-pw-indigo font-bold mt-1">{selectedCount} Questions</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: Interaction Area */}
                <div className="lg:col-span-8">
                    <AnimatePresence mode="wait">
                        {step === 'subject' && (
                            <motion.div
                                key="subject"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h1 className="text-3xl font-display font-bold text-pw-violet px-2">Choose a Subject</h1>
                                {categories.subjects.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-pw-border shadow-pw-md">
                                        <FaSpinner className="animate-spin text-pw-indigo text-3xl mb-4" />
                                        <p className="text-gray-500 font-medium">Loading your subjects...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {categories.subjects.map((sub, idx) => {
                                            const Icon = subjectIcons[sub] || FaBook;
                                            return (
                                                <motion.button
                                                    key={sub}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    onClick={() => { setSelectedSubject(sub); setStep('chapter'); }}
                                                    className="group relative bg-white hover:bg-gradient-to-br hover:from-pw-indigo hover:to-pw-violet p-6 rounded-[2rem] shadow-pw-md hover:shadow-pw-lg hover:-translate-y-1 transition-all border border-pw-border hover:border-transparent text-left overflow-hidden min-h-[160px] flex flex-col justify-between"
                                                >
                                                    <div className="flex items-start justify-between w-full">
                                                        <div className="w-14 h-14 rounded-2xl bg-pw-surface group-hover:bg-white/20 flex items-center justify-center text-2xl text-pw-indigo group-hover:text-white transition-colors shadow-inner">
                                                            <Icon />
                                                        </div>
                                                        <span className="bg-pw-surface group-hover:bg-white/20 text-gray-500 group-hover:text-white px-3 py-1.5 rounded-full text-xs font-bold transition-colors">
                                                            {(categories.chapters && categories.chapters[sub] && categories.chapters[sub].length) || 0} Chaps
                                                        </span>
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-pw-violet group-hover:text-white capitalize transition-colors mt-4">{sub}</h3>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {step === 'chapter' && (
                            <motion.div
                                key="chapter"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h1 className="text-3xl font-display font-bold text-pw-violet px-2">
                                    Select <span className="capitalize text-pw-indigo">{selectedSubject}</span> Chapter
                                </h1>

                                <button
                                    onClick={() => {
                                        // Auto-calculate total for all mixed
                                        const total = categories.chapters[selectedSubject]?.reduce((acc, c) => acc + c.count, 0) || 50;
                                        handleChapterClick("All Mixed", total);
                                    }}
                                    className="w-full bg-gradient-to-r from-pw-indigo to-pw-violet hover:shadow-pw-lg text-white p-6 rounded-[2rem] shadow-pw-md transition-all flex items-center justify-between group border border-transparent hover:-translate-y-0.5"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl backdrop-blur-sm shadow-inner">
                                            <FaPlay className="ml-1" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-2xl font-bold">Play Mixed Chapters</h3>
                                            <p className="text-indigo-100 text-sm font-medium opacity-90">Best for full revision</p>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                        <FaCheckCircle className="text-white text-xl" />
                                    </div>
                                </button>

                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar pb-10">
                                    {categories.chapters[selectedSubject]?.map((chap, idx) => (
                                        <motion.button
                                            key={chap.name}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => handleChapterClick(chap.name, chap.count)}
                                            className="w-full bg-white hover:bg-pw-surface border border-pw-border p-5 rounded-2xl text-left flex items-center justify-between group transition-all hover:shadow-pw-sm"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-2 w-2 rounded-full bg-gray-300 group-hover:bg-pw-indigo transition-colors" />
                                                <span className="font-bold text-gray-700 group-hover:text-pw-violet text-lg transition-colors">{chap.name}</span>
                                            </div>
                                            <span className="text-xs text-gray-400 group-hover:text-pw-indigo font-bold bg-gray-50 group-hover:bg-pw-indigo/10 px-3 py-1.5 rounded-lg transition-colors">
                                                {chap.count} Qs
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 'confirm' && (
                            <motion.div
                                key="confirm"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-[2.5rem] p-8 md:p-12 text-center shadow-pw-xl border border-pw-border max-w-2xl mx-auto mt-8"
                            >
                                <div className="w-28 h-28 mx-auto mb-8 relative">
                                    <div className="absolute inset-0 bg-pw-indigo rounded-full blur-2xl opacity-20 animate-pulse"></div>
                                    <img
                                        src={user?.photoURL || ''}
                                        alt={user?.displayName || 'User'}
                                        className="w-full h-full rounded-full border-4 border-white shadow-lg relative z-10 bg-gray-200 object-cover"
                                        onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${user?.displayName}&background=8b5cf6&color=fff`; }}
                                    />
                                    <div className="absolute bottom-1 right-1 z-20 bg-green-500 text-white p-2.5 rounded-full border-4 border-white shadow-sm">
                                        <FaCheckCircle size={14} />
                                    </div>
                                </div>

                                <h2 className="text-4xl font-display font-bold text-pw-violet mb-3">Ready to Host?</h2>
                                <p className="text-gray-500 mb-10 text-lg">
                                    Creating room as <span className="font-bold text-pw-indigo">{user?.displayName}</span>
                                    <br />
                                    <span className="text-sm bg-pw-surface border border-pw-border text-gray-600 rounded-xl px-4 py-2 mt-4 inline-block font-semibold shadow-sm">
                                        {selectedCount} Questions • {selectedChapter}
                                    </span>
                                </p>

                                <button
                                    onClick={handleCreate}
                                    disabled={isLoading || !user}
                                    className="w-full bg-gradient-to-r from-pw-indigo to-pw-violet hover:shadow-pw-lg text-white py-5 rounded-2xl font-bold text-xl shadow-pw-md transition-all flex items-center justify-center gap-3 hover:-translate-y-1 active:scale-[0.98]"
                                >
                                    {isLoading ? <FaSpinner className="animate-spin" /> : existingRoomId ? <><FaSave /> Update & Start Game</> : <><FaPlay /> Create Room & Invite</>}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

export default function HostGamePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-pw-surface flex items-center justify-center">Loading...</div>}>
            <HostGameContent />
        </Suspense>
    );
}
