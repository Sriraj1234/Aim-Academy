'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    HiAcademicCap,
    HiBookOpen,
    HiClock,
    HiChevronRight,
    HiRefresh,
    HiX
} from 'react-icons/hi'
import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { CategoryData, Taxonomy } from '@/data/types'
import { useQuiz } from '@/hooks/useQuiz'
import { Header } from '@/components/shared/Header'
import { ChapterSummary } from '@/components/home/ChapterSummary'

// Internal Component for Customization
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
    // Remove duplicates if totalCount matches a base option exactly
    const uniqueOptions = Array.from(new Set(options));

    const [selected, setSelected] = useState<number>(options[0] || totalCount);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Customize Quiz</h3>
                        <p className="text-sm text-gray-500">{chapterName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                        <HiX size={20} />
                    </button>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Number of Questions</label>
                    <div className="grid grid-cols-3 gap-3">
                        {uniqueOptions.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => setSelected(opt)}
                                className={`
                                    py-2 px-3 rounded-xl text-sm font-bold transition-all border-2
                                    ${selected === opt
                                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                                        : 'border-transparent bg-gray-100 text-gray-600 hover:bg-gray-200'}
                                `}
                            >
                                {opt === totalCount ? `All (${opt})` : opt}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => onConfirm(selected)}
                    className="w-full py-3.5 rounded-xl bg-purple-600 text-white font-bold text-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/30"
                >
                    Start Quiz
                </button>
            </motion.div>
        </div>
    )
}

function SelectionContent() {
    const router = useRouter()
    const { userProfile, loading: authLoading } = useAuth()
    const { startQuiz } = useQuiz()
    const searchParams = useSearchParams()

    // Default mode is subject
    const [activeCategories, setActiveCategories] = useState<CategoryData>({ subjects: [], chapters: {} })
    const [loading, setLoading] = useState(true)
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
    const [mode, setMode] = useState<'subject' | 'chapter'>('subject') // derived from interactions

    // Customization State
    const [customizing, setCustomizing] = useState<{ name: string, count: number } | null>(null)

    // ... (rest of useEffects remain same until handlers)

    // Fetch Metadata based on User Profile
    // Fetch Metadata based on User Profile
    useEffect(() => {
        const fetchCategories = async () => {
            if (!userProfile) return
            setLoading(true)
            try {
                const docRef = doc(db, 'metadata', 'taxonomy')
                const docSnap = await getDoc(docRef)
                if (docSnap.exists()) {
                    const fullTaxonomy = docSnap.data() as Taxonomy
                    const key = `${userProfile?.board || 'cbse'}_${userProfile?.class || '10'}`
                    if (fullTaxonomy[key]) {
                        setActiveCategories(fullTaxonomy[key])
                    }
                }
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        if (!authLoading && userProfile) fetchCategories()
        else if (!authLoading && !userProfile) setLoading(false)
    }, [userProfile, authLoading])

    // Auto-Select Logic from URL
    useEffect(() => {
        const paramChapter = searchParams.get('chapter');
        const paramSubject = searchParams.get('subject');

        if (paramChapter && paramSubject && !loading && activeCategories.chapters) {
            // 1. Set Subject if valid
            // Handle legacy "Social Science" param by checking "Economics"
            let paramSubjectClean = paramSubject.toLowerCase();
            if (paramSubjectClean === 'social science') paramSubjectClean = 'economics';

            const subKey = Object.keys(activeCategories.chapters).find(k => k.toLowerCase() === paramSubjectClean);
            if (subKey) {
                setSelectedSubject(subKey);

                // 2. Find Chapter and Trigger Modal
                const chapters = activeCategories.chapters[subKey] || [];
                const targetChapter = chapters.find(c =>
                    (typeof c === 'string' ? c : c.name).toLowerCase() === paramChapter.toLowerCase()
                );

                if (targetChapter) {
                    const name = typeof targetChapter === 'string' ? targetChapter : targetChapter.name;
                    const count = typeof targetChapter === 'string' ? 0 : targetChapter.count;
                    setCustomizing({ name, count });
                }
            }
        }
    }, [searchParams, loading, activeCategories]);

    const [selectedScience, setSelectedScience] = useState(false)
    const [selectedSST, setSelectedSST] = useState(false)
    const [selectedLang, setSelectedLang] = useState(false)

    const scienceSubjects = ['physics', 'chemistry', 'biology']
    const sstSubjects = ['history', 'geography', 'civics', 'economics', 'political science', 'disaster management']
    const langSubjects = ['english', 'hindi', 'sanskrit']

    const displayedSubjects = activeCategories.subjects?.filter(
        sub => !scienceSubjects.includes(sub.toLowerCase()) &&
            !sstSubjects.includes(sub.toLowerCase()) &&
            !langSubjects.includes(sub.toLowerCase()) &&
            sub.toLowerCase() !== 'social studies' && // Explicitly hide Social Studies
            sub.toLowerCase() !== 'mathematics' // Hide duplicate Mathematics ONLY (exact match, not Math/Maths)
    ) || []

    const hasScience = activeCategories.subjects?.some(sub => scienceSubjects.includes(sub.toLowerCase()))
    const hasSST = activeCategories.subjects?.some(sub => sstSubjects.includes(sub.toLowerCase()))
    const hasLang = activeCategories.subjects?.some(sub => langSubjects.includes(sub.toLowerCase()))

    const subjects = displayedSubjects
    const chapters = selectedSubject ? (activeCategories.chapters?.[selectedSubject] || []) : []

    const handleSubjectClick = (sub: string) => {
        const lower = sub.toLowerCase()
        if (lower === 'science') {
            setSelectedScience(true)
            setSelectedSST(false)
            setSelectedLang(false)
        } else if (lower === 'social science') {
            setSelectedSST(true)
            setSelectedScience(false)
            setSelectedLang(false)
        } else if (lower === 'languages') {
            setSelectedLang(true)
            setSelectedScience(false)
            setSelectedSST(false)
        } else {
            setSelectedSubject(sub)
            setSelectedScience(false)
            setSelectedSST(false)
            setSelectedLang(false)
        }
    }

    const handleBack = () => {
        if (selectedSubject) {
            if (scienceSubjects.includes(selectedSubject.toLowerCase())) {
                setSelectedSubject(null)
                setSelectedScience(true)
            } else if (sstSubjects.includes(selectedSubject.toLowerCase())) {
                setSelectedSubject(null)
                setSelectedSST(true)
            } else if (langSubjects.includes(selectedSubject.toLowerCase())) {
                setSelectedSubject(null)
                setSelectedLang(true)
            } else {
                setSelectedSubject(null)
            }
        } else if (selectedScience || selectedSST || selectedLang) {
            setSelectedScience(false)
            setSelectedSST(false)
            setSelectedLang(false)
        }
    }

    const handleChapterClick = (chap: string, count: number = 20) => {
        // Trigger Modal instead of immediate start
        setCustomizing({ name: chap, count: count })
    }

    const handleConfirmStart = (count: number) => {
        if (customizing) {
            startQuiz(selectedSubject!, count, customizing.name)
            router.push('/play/quiz')
        }
    }

    if (authLoading) return (
        <div className="min-h-screen bg-pw-surface flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pw-indigo"></div>
        </div>
    )

    return (
        <div className="min-h-screen bg-pw-surface pb-20 font-sans">
            <Header />

            {/* Customization Modal - PW Style */}
            <AnimatePresence>
                {customizing && (
                    <CustomizeModal
                        totalCount={customizing.count}
                        chapterName={customizing.name}
                        onConfirm={handleConfirmStart}
                        onClose={() => setCustomizing(null)}
                    />
                )}
            </AnimatePresence>

            <main className="pt-24 px-4 max-w-6xl mx-auto">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    {(selectedSubject || selectedScience) && (
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-sm text-pw-indigo font-bold mb-3 hover:text-pw-violet transition-colors group"
                        >
                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                            Back to {
                                selectedSubject && scienceSubjects.includes(selectedSubject.toLowerCase()) ? 'Science' :
                                    selectedSubject && sstSubjects.includes(selectedSubject.toLowerCase()) ? 'Social Science' :
                                        'Subjects'
                            }
                        </button>
                    )}

                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-black text-pw-violet capitalize tracking-tight">
                            {selectedSubject
                                ? `${selectedSubject} Chapters`
                                : selectedScience || selectedSST
                                    ? 'Select Branch'
                                    : `Practice Questions`}
                        </h1>
                        <span className="px-2 py-1 bg-pw-surface border border-pw-border rounded text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            {userProfile?.board || 'CBSE'} {userProfile?.class || '10'}
                        </span>
                    </div>

                    <p className="text-pw-indigo/80 font-medium">
                        {selectedSubject
                            ? `Select a chapter from ${selectedSubject} to practice.`
                            : selectedScience || selectedSST
                                ? `Choose a ${selectedSST ? 'social science' : 'science'} branch to continue.`
                                : `Select a subject for ${userProfile?.board?.toUpperCase() || 'CBSE'} Class ${userProfile?.class || '10'}`}
                    </p>

                    {/* AI Revision Notes Integration */}
                    <div className="mt-6 max-w-md">
                        <ChapterSummary subject={selectedSubject || undefined} />
                    </div>
                </motion.div>

                {/* GRID Container */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {loading ? (
                        [...Array(6)].map((_, i) => (
                            <div key={i} className="h-32 bg-white rounded-2xl shadow-pw-sm animate-pulse border border-pw-border" />
                        ))
                    ) : !selectedSubject && !selectedScience && !selectedSST && !selectedLang ? (
                        /* MAIN SUBJECT VIEW */
                        <>
                            {subjects.length === 0 && !hasScience ? (
                                <div className="col-span-full py-16 flex flex-col items-center justify-center text-center opacity-70">
                                    <div className="text-gray-400 font-bold">Coming Soon</div>
                                </div>
                            ) : (
                                <>
                                    {hasScience && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => handleSubjectClick('Science')}
                                            className="bg-white p-6 rounded-2xl shadow-pw-sm border border-pw-border cursor-pointer hover:shadow-pw-md hover:-translate-y-1 transition-all group relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <HiAcademicCap className="text-8xl text-pw-indigo transform rotate-[-20deg]" />
                                            </div>

                                            <div className="flex justify-between items-start mb-4 relative z-10">
                                                <div className="p-3 rounded-xl bg-pw-indigo/10 text-pw-indigo group-hover:bg-pw-indigo group-hover:text-white transition-colors">
                                                    <HiAcademicCap className="text-2xl" />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-pw-surface text-pw-indigo px-2 py-1 rounded-lg border border-pw-indigo/10">Group</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-pw-violet group-hover:text-pw-indigo transition-colors capitalize mb-1 relative z-10">Science</h3>
                                            <p className="text-sm text-gray-500 relative z-10">Physics, Chemistry, Biology</p>
                                        </motion.div>
                                    )}

                                    {hasSST && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => handleSubjectClick('Social Science')}
                                            className="bg-white p-6 rounded-2xl shadow-pw-sm border border-pw-border cursor-pointer hover:shadow-pw-md hover:-translate-y-1 transition-all group relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <HiAcademicCap className="text-8xl text-orange-500 transform rotate-[-20deg]" />
                                            </div>

                                            <div className="flex justify-between items-start mb-4 relative z-10">
                                                <div className="p-3 rounded-xl bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                                    <HiAcademicCap className="text-2xl" />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-pw-surface text-orange-600 px-2 py-1 rounded-lg border border-orange-200">Group</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-pw-violet group-hover:text-orange-600 transition-colors capitalize mb-1 relative z-10">Social Science</h3>
                                            <p className="text-sm text-gray-500 relative z-10">History, Civics, Geography...</p>
                                        </motion.div>
                                    )}

                                    {hasLang && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => handleSubjectClick('Languages')}
                                            className="bg-white p-6 rounded-2xl shadow-pw-sm border border-pw-border cursor-pointer hover:shadow-pw-md hover:-translate-y-1 transition-all group relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <HiAcademicCap className="text-8xl text-pink-500 transform rotate-[-20deg]" />
                                            </div>

                                            <div className="flex justify-between items-start mb-4 relative z-10">
                                                <div className="p-3 rounded-xl bg-pink-100 text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                                                    <HiAcademicCap className="text-2xl" />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-pw-surface text-pink-600 px-2 py-1 rounded-lg border border-pink-200">Group</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-pw-violet group-hover:text-pink-600 transition-colors capitalize mb-1 relative z-10">Languages</h3>
                                            <p className="text-sm text-gray-500 relative z-10">Hindi, Sanskrit, English</p>
                                        </motion.div>
                                    )}
                                    {subjects.map((sub, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => handleSubjectClick(sub)}
                                            className="bg-white p-6 rounded-2xl shadow-pw-sm border border-pw-border cursor-pointer hover:shadow-pw-md hover:-translate-y-1 transition-all group relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <HiAcademicCap className="text-8xl text-pw-indigo transform rotate-[-20deg]" />
                                            </div>

                                            <div className="flex justify-between items-start mb-4 relative z-10">
                                                <div className="p-3 rounded-xl bg-pw-lavender/20 text-pw-indigo group-hover:bg-pw-indigo group-hover:text-white transition-colors">
                                                    <HiAcademicCap className="text-2xl" />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-pw-surface text-pw-indigo px-2 py-1 rounded-lg border border-pw-indigo/10">Subject</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-pw-violet group-hover:text-pw-indigo transition-colors capitalize mb-1 relative z-10">{sub}</h3>
                                            <p className="text-sm text-gray-500 relative z-10">{(activeCategories.chapters?.[sub] || []).length} Chapters</p>
                                        </motion.div>
                                    ))}
                                </>
                            )}
                        </>
                    ) : (selectedScience || selectedSST || selectedLang) && !selectedSubject ? (
                        /* SCIENCE or SST or LANG BRANCH VIEW */
                        <>
                            {activeCategories.subjects?.filter(s =>
                                selectedScience
                                    ? scienceSubjects.includes(s.toLowerCase())
                                    : selectedLang
                                        ? langSubjects.includes(s.toLowerCase())
                                        : sstSubjects.includes(s.toLowerCase())
                            ).map((sub, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => handleSubjectClick(sub)}
                                    className="bg-white p-6 rounded-2xl shadow-pw-sm border border-pw-border cursor-pointer hover:shadow-pw-md hover:-translate-y-1 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <HiAcademicCap className={`text-8xl transform rotate-[-20deg] ${selectedSST ? 'text-orange-500' : selectedLang ? 'text-pink-500' : 'text-pw-indigo'}`} />
                                    </div>

                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className={`p-3 rounded-xl transition-colors ${selectedSST ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' : selectedLang ? 'bg-pink-50 text-pink-600 group-hover:bg-pink-600 group-hover:text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                                            <HiAcademicCap className="text-2xl" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-pw-violet group-hover:text-pw-indigo transition-colors capitalize mb-1 relative z-10">{sub}</h3>
                                    <p className="text-sm text-gray-500 relative z-10">{(activeCategories.chapters?.[sub] || []).length} Chapters</p>
                                </motion.div>
                            ))}
                        </>
                    ) : (
                        /* CHAPTER VIEW */
                        <>
                            {chapters.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-gray-400">
                                    <p>No chapters found for this subject yet.</p>
                                </div>
                            ) : (
                                chapters.map((item: any, idx) => {
                                    const name = typeof item === 'string' ? item : item.name
                                    const count = typeof item === 'string' ? 0 : item.count

                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            onClick={() => handleChapterClick(name, count)}
                                            className="bg-white p-5 rounded-2xl border border-pw-border hover:border-pw-indigo hover:shadow-pw-sm cursor-pointer transition-all flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-pw-surface text-pw-indigo flex items-center justify-center group-hover:bg-pw-indigo group-hover:text-white Transition-all">
                                                    <HiBookOpen />
                                                </div>
                                                <span className="font-bold text-pw-violet group-hover:text-pw-indigo transition-colors">{name}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {count > 0 && <span className="text-xs bg-pw-surface px-2 py-1 rounded text-gray-500 font-bold border border-pw-border">{count} Qs</span>}
                                                <HiChevronRight className="text-gray-300 group-hover:text-pw-indigo" />
                                            </div>
                                        </motion.div>
                                    )
                                })
                            )}
                        </>
                    )}
                </div>
            </main >
        </div >
    )
}

export default function SelectionPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
            <SelectionContent />
        </Suspense>
    )
}
