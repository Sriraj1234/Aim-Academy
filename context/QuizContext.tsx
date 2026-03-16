'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import useSWR from 'swr'
import toast from 'react-hot-toast'
import { Question, CategoryData } from '@/data/types'
import { mockQuestions } from '@/data/mock'
import { db } from '@/lib/firebase'
import { mistakesLocalStore } from '@/utils/mistakesLocalStore'
import { collection, addDoc, getDocs, query, where, limit, doc, getDoc, getCountFromServer, deleteDoc, orderBy, documentId, setDoc } from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'

interface QuizContextType {
    questions: Question[]
    currentQuestionIndex: number
    answers: (number | null)[]
    score: number
    isFinished: boolean
    isLoading: boolean
    isSavingResult: boolean
    startTime: number
    endTime: number
    categories: CategoryData
    startQuiz: (subject?: string, count?: number, chapter?: string, difficulty?: string) => Promise<void>
    startAIQuiz: (questions: Question[]) => void
    submitAnswer: (answerIndex: number | null) => void
    nextQuestion: () => void
    prevQuestion: () => void
    skipQuestion: () => void
    toggleBookmark: (questionId: string) => void
    bookmarks: string[]
    resetQuiz: () => void
    calculateScore: () => number
}

const QuizContext = createContext<QuizContextType>({} as QuizContextType)

export const QuizProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, userProfile, updateProfile, addXP } = useAuth()
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<(number | null)[]>([])
    const [isFinished, setIsFinished] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [startTime, setStartTime] = useState<number>(0)
    const [endTime, setEndTime] = useState<number>(0)
    const [isSavingResult, setIsSavingResult] = useState(false)

    // ─── Session Persistence Helpers ─────────────────────────────────────────
    const SESSION_KEY = 'quiz_session'

    const saveSession = (q: Question[], idx: number, ans: (number | null)[], st: number) => {
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify({
                questions: q,
                currentQuestionIndex: idx,
                answers: ans,
                startTime: st,
                savedAt: Date.now()
            }))
        } catch (_) { /* sessionStorage might be unavailable in some browsers */ }
    }

    const clearSession = () => {
        try { sessionStorage.removeItem(SESSION_KEY) } catch (_) { }
    }

    // Restore session on mount (only once, before any quiz is started)
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY)
            if (!raw) return
            const session = JSON.parse(raw)
            // Only restore if session is < 2 hours old and has questions
            const age = Date.now() - (session.savedAt || 0)
            if (age > 2 * 60 * 60 * 1000) { clearSession(); return }
            if (!Array.isArray(session.questions) || session.questions.length === 0) return

            setQuestions(session.questions)
            setCurrentQuestionIndex(session.currentQuestionIndex ?? 0)
            setAnswers(session.answers ?? new Array(session.questions.length).fill(null))
            setStartTime(session.startTime ?? Date.now())
            toast('Quiz resume ho gayi wahan se jahan tune chhodi thi! 📚', { icon: '🔄', duration: 3000 })
        } catch (_) { /* corrupt session — ignore */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    // ─────────────────────────────────────────────────────────────────────────

    const [categories, setCategories] = useState<CategoryData>({ subjects: [], chapters: {} })

    // SWR Implementation for Metadata (Stale-While-Revalidate) ⚡
    // This allows instant loading from cache while checking for updates
    const fetcher = async () => {
        const docRef = doc(db, 'metadata', 'taxonomy')
        const docSnap = await getDoc(docRef)
        return docSnap.exists() ? (docSnap.data() as CategoryData) : { subjects: [], chapters: {} }
    }

    const { data: swrCategories } = useSWR('taxonomy', fetcher, {
        revalidateOnFocus: false, // Don't re-fetch just by clicking window (save data)
        dedupingInterval: 60000 * 60, // Cache for 1 hour in memory
    })

    useEffect(() => {
        if (swrCategories) {
            setCategories(swrCategories)
        }
    }, [swrCategories])

    const startQuiz = async (subject?: string, count: number = 20, chapter?: string, difficulty?: string) => {
        setIsLoading(true)
        setIsFinished(false)
        setIsSavingResult(false)
        setAnswers([])
        setCurrentQuestionIndex(0)
        setQuestions([])
        setStartTime(Date.now())
        setEndTime(0)

        try {
            // ── Build hierarchical path matching upload format ─────────────────────
            // Path: questions/{BOARD}/{Class N}/{stream}/{subject}
            // e.g.  questions/BSEB/Class 10/general/maths
            const brd = userProfile?.board || '';
            const cls = userProfile?.class || '';
            const strm = userProfile?.stream || '';
            const classNum = parseInt(cls.toString().replace(/[^0-9]/g, '') || '0', 10);

            // ── FIXED: Match exact format used during upload ──────────────────────
            const boardKey = (() => {
                const b = brd.toLowerCase();
                if (b === 'bihar board' || b === 'bseb') return 'BSEB';
                if (b === 'cbse') return 'CBSE';
                if (b === 'icse') return 'ICSE';
                if (b === 'up board' || b === 'up') return 'UP';
                return brd.trim() || 'Other';
            })();
            const classKey = (() => {
                const n = cls.toString().replace(/[^0-9]/g, '');
                return n ? `Class ${n}` : cls.trim();
            })();
            const streamKey = classNum >= 11 ? ((strm || 'Science').trim() || 'Science') : 'general';

            // Normalise subject → lowercase, spaces→underscore ("Social Science" → "social_science")
            let subjectKey = (subject || '').toLowerCase().trim().replace(/\s+/g, '_');
            // Common UI aliases
            if ((subject || '').includes('English')) subjectKey = 'english';
            else if ((subject || '').includes('Hindi')) subjectKey = 'hindi';

            const constraints: any[] = [];
            if (chapter) constraints.push(where('chapter', '==', chapter));
            // ── Difficulty filter (skip if 'mix' or undefined) ────────────────────
            if (difficulty && difficulty !== 'mix') {
                constraints.push(where('level', '==', difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase()));
            }

            const fetchLimit = Math.min(count * 3, 200);

            // ── Try hierarchical path first ───────────────────────────────────
            let q: Question[] = [];
            if (boardKey && classKey && subjectKey) {
                const colPath = `questions/${boardKey}/${classKey}/${streamKey}/${subjectKey}`;
                console.log('QuizContext: querying hierarchy', colPath, chapter ? `chapter=${chapter}` : '');
                const hierRef = collection(db, colPath);
                const hierQuery = query(hierRef, ...constraints, limit(fetchLimit));
                const hierSnap = await getDocs(hierQuery);
                hierSnap.forEach(docSnap => {
                    const data = docSnap.data() as Record<string, unknown>;
                    if (!q.some(e => e.id === docSnap.id)) {
                        q.push({ id: docSnap.id, ...data } as unknown as Question);
                    }
                });
            }

            // ── Fallback to flat collection if hierarchy returned nothing ─────
            if (q.length === 0) {
                console.warn('QuizContext: hierarchy returned 0, falling back to flat collection');
                const flatRef = collection(db, 'questions');
                const flatConstraints: any[] = [];
                if (brd) {
                    const bs = Array.from(new Set([brd, brd.toLowerCase(), brd.toUpperCase(), 'Bihar Board', 'bseb', 'BSEB'])).slice(0, 10);
                    flatConstraints.push(where('board', 'in', bs));
                }
                if (subject) {
                    let dbSub = subject;
                    if (subject.includes('English')) dbSub = 'English';
                    else if (subject.includes('Hindi')) dbSub = 'Hindi';
                    const ss = Array.from(new Set([dbSub, dbSub.toLowerCase(), dbSub.charAt(0).toUpperCase() + dbSub.slice(1)])).slice(0, 10);
                    flatConstraints.push(where('subject', 'in', ss));
                }
                if (chapter) flatConstraints.push(where('chapter', '==', chapter));
                const flatQuery = query(flatRef, ...flatConstraints, limit(fetchLimit));
                const flatSnap = await getDocs(flatQuery);
                flatSnap.forEach(docSnap => {
                    const data = docSnap.data() as Record<string, unknown>;
                    if (cls && data.class) {
                        const userCls = cls.toString().replace(/\D/g, '');
                        const qCls = String(data.class).replace(/\D/g, '');
                        if (userCls && qCls && userCls !== qCls && String(data.class).toLowerCase() !== 'all') return;
                    }
                    if (!q.some(e => e.id === docSnap.id)) {
                        q.push({ id: docSnap.id, ...data } as unknown as Question);
                    }
                });
            }


            if (q.length === 0) {
                console.warn(`No questions found in DB for filter, checking mock`)
                // Fallback to mock (and filter mock manually)
                const mq = mockQuestions.filter(x => {
                    let match = true;
                    if (userProfile?.board) match = match && x.board === userProfile.board;
                    if (subject) match = match && x.subject === subject.toLowerCase();
                    if (chapter) match = match && x.chapter === chapter;
                    return match;
                })

                if (mq.length === 0) {
                    console.warn("No matching questions found.");
                }

                setQuestions(mq.slice(0, count))
                setAnswers(new Array(Math.min(mq.length, count)).fill(null))
                return
            }

            // Shuffle helper
            const shuffle = (arr: Question[]) => {
                for (let i = arr.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                }
                return arr;
            };

            // Shuffle and take only requested count
            q = shuffle(q).slice(0, count);
            console.log(`Final question count after shuffle/slice: ${q.length}`);

            setQuestions(q)
            setAnswers(new Array(q.length).fill(null))
            // Session save
            saveSession(q, 0, new Array(q.length).fill(null), Date.now())

        } catch (error) {
            console.error("Failed to load questions", error)
            toast.error('Questions load nahi ho sake. Check your internet connection.')
            // Fallback
            let mq = mockQuestions
            if (subject) mq = mq.filter(item => item.subject === subject)
            setQuestions(mq.slice(0, count))
            setAnswers(new Array(Math.min(mq.length, count)).fill(null))
        } finally {
            setIsLoading(false)
        }
    }

    const submitAnswer = (answerIndex: number | null) => {
        const newAnswers = [...answers]
        newAnswers[currentQuestionIndex] = answerIndex
        setAnswers(newAnswers)
        // Persist updated answers to session
        saveSession(questions, currentQuestionIndex, newAnswers, startTime)
    }

    const nextQuestion = async () => {
        if (currentQuestionIndex < questions.length - 1) {
            const nextIdx = currentQuestionIndex + 1
            setCurrentQuestionIndex(nextIdx)
            // Persist new index to session
            saveSession(questions, nextIdx, answers, startTime)
        } else {
            // FINISH QUIZ LOGIC
            setEndTime(Date.now())
            setIsSavingResult(true)

            // Safety: Force navigation after 8 seconds max if Firestore hangs
            const savePromise = saveQuizResult();
            const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 8000));

            try {
                await Promise.race([savePromise, timeoutPromise]);
            } catch (err) {
                console.error("Critical error saving result:", err)
            } finally {
                clearSession() // Clear session when quiz finishes
                setIsSavingResult(false)
                setIsFinished(true)
            }
        }
    }

    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1)
        }
    }

    // Skip is just next without saving answer (or keeping null)
    const skipQuestion = () => {
        nextQuestion()
    }

    const [bookmarks, setBookmarks] = useState<string[]>([])

    // Sync bookmarks from profile on mount/update
    useEffect(() => {
        if (userProfile?.bookmarkedQuestions) {
            setBookmarks(userProfile.bookmarkedQuestions)
        }
    }, [userProfile?.bookmarkedQuestions])

    const toggleBookmark = async (questionId: string) => {
        const isBookmarked = bookmarks.includes(questionId)
        const newBookmarks = isBookmarked
            ? bookmarks.filter(id => id !== questionId)
            : [...bookmarks, questionId]

        // precise local update for UI responsiveness
        setBookmarks(newBookmarks)

        // persist to profile (Firestore + AuthContext state)
        if (user) {
            try {
                await updateProfile({ bookmarkedQuestions: newBookmarks })
            } catch (e) {
                console.error("Failed to save bookmark", e)
                toast.error('Bookmark save nahi hua. Dobara try karo.')
                // Revert local state on failure
                setBookmarks(bookmarks)
            }
        }
    }

    const resetQuiz = () => {
        clearSession()
        setCurrentQuestionIndex(0)
        setAnswers(new Array(questions.length).fill(null))
        setBookmarks([])
        setIsFinished(false)
        setIsSavingResult(false)
    }

    const calculateScore = () => {
        let score = 0
        questions.forEach((q, index) => {
            if (answers[index] === q.correctAnswer) {
                // Defensive check: ensure q.marks is a number, default to 1
                score += (typeof q.marks === 'number' ? q.marks : 1)
            }
        })
        return score
    }

    const saveQuizResult = async () => {
        if (!user || questions.length === 0) return

        const finalScore = calculateScore()
        // Calculate correct answers count for XP logic
        let correctAnswers = 0;
        questions.forEach((q, index) => {
            if (answers[index] === q.correctAnswer) {
                correctAnswers++;
            }
        });
        const totalMarks = questions.reduce((acc, q) => acc + (typeof q.marks === 'number' ? q.marks : 1), 0)

        let percentage = 0;
        if (totalMarks > 0) {
            percentage = Math.round((finalScore / totalMarks) * 100);
        }

        // Calculate XP: 2 XP per correct answer
        const xpEarned = correctAnswers * 2

        console.log("Saving Quiz Result:", {
            finalScore,
            totalMarks,
            percentage,
            correctAnswers,
            xpEarned
        });

        try {
            // 1. Save detailed result to Firestore (with Limit)
            const resultsRef = collection(db, 'users', user.uid, 'quiz_results');

            // Add new result
            // Ensure answers are serialized (Firestore doesn't like undefined in arrays sometimes)
            const serializedAnswers = answers.map(a => (a === undefined || a === null) ? null : a)

            await addDoc(resultsRef, {
                score: finalScore,
                totalMarks,
                percentage,
                totalQuestions: questions.length,
                date: new Date().toISOString(),
                subject: questions[0]?.subject || 'mixed',
                duration: (endTime || Date.now()) - startTime || 0, // Fallback if endTime is missing
                xpEarned,
                questions,
                answers: serializedAnswers
            })

            // Maintenance: Run asynchronously to not block UI
            const cleanUpHistory = async () => {
                try {
                    const q = query(resultsRef, orderBy('date', 'desc'));
                    const snapshot = await getDocs(q);

                    if (snapshot.size > 50) {
                        const docsToDelete = snapshot.docs.slice(50);
                        const deletePromises = docsToDelete.map(doc => deleteDoc(doc.ref));
                        await Promise.all(deletePromises);
                    }
                } catch (e) {
                    console.error("Cleanup failed", e);
                }
            }
            cleanUpHistory(); // Fire and forget

            // 2. Calculate new stats
            const currentStats = userProfile?.stats || { quizzesTaken: 0, avgScore: 0, rank: 0 }
            const newQuizzesTaken = (currentStats.quizzesTaken || 0) + 1
            const oldTotalScore = (currentStats.avgScore || 0) * (currentStats.quizzesTaken || 0)
            const newAvgScore = Math.round((oldTotalScore + percentage) / newQuizzesTaken)

            // 3. Calculate Rank
            const q = query(
                collection(db, 'users'),
                where('stats.avgScore', '>', newAvgScore)
            )
            const snapshot = await getCountFromServer(q)
            const newRank = snapshot.data().count + 1

            // 4. Update Profile
            await updateProfile({
                stats: {
                    quizzesTaken: newQuizzesTaken,
                    avgScore: newAvgScore,
                    rank: newRank
                }
            })

            // 5. Award XP (Gamification)
            if (xpEarned > 0) {
                await addXP(xpEarned)
            }

            // 6. TRACK MISTAKES (Smart Notebook)
            // Identify wrong answers and save them. Skips (null) are NOT saved as mistakes currently.
            // If user wants skips to be mistakes, change condition to: answers[i] !== q.correctAnswer
            const mistakes = questions.filter((q, i) => answers[i] !== null && answers[i] !== q.correctAnswer);

            if (mistakes.length > 0) {
                // Save mistakes locally
                mistakes.forEach(q => {
                    if (!q.id) return;

                    // Determine user answer for this question
                    const qIndex = questions.indexOf(q);
                    const uAnsIndex = answers[qIndex];
                    // If q.options is array of strings, we get the string value
                    let uAnsText: string | null = null;
                    if (uAnsIndex !== null && uAnsIndex !== undefined && q.options && q.options[uAnsIndex]) {
                        uAnsText = q.options[uAnsIndex];
                    }

                    // Map to LocalMistake format
                    mistakesLocalStore.saveMistake(user.uid, {
                        id: q.id,
                        question: q.question, // Verify 'question' prop name in Question type, it's usually 'question' or 'text'
                        options: q.options,
                        correctAnswer: q.options && typeof q.correctAnswer === 'number' ? q.options[q.correctAnswer] : String(q.correctAnswer),
                        userAnswer: uAnsText,
                        explanation: q.explanation,
                        subject: q.subject,
                        chapter: q.chapter || 'General'
                    });
                });
            }

        } catch (error) {
            console.error("Error saving quiz result:", error)
            toast.error('Result save nahi ho saka — but tumhara score yahan dikha raha hai!', { duration: 5000 })
            // Don't re-throw. We want to allow the UI to finish even if saving fails.
            // The user will see locally calculated results (from Context) even if Firestore fails.
        }
    }

    const startAIQuiz = (aiQuestions: Question[]) => {
        setIsLoading(true)
        setIsFinished(false)
        setIsSavingResult(false)
        setAnswers([])
        setCurrentQuestionIndex(0)

        // Randomize options for each question to ensure freshness if re-used (optional but good)
        // Ensure IDs are unique if needed, but AI generator handles that.
        setQuestions(aiQuestions)
        setAnswers(new Array(aiQuestions.length).fill(null))
        setStartTime(Date.now())
        setEndTime(0)
        setIsLoading(false)
    }

    return (
        <QuizContext.Provider value={{
            questions,
            currentQuestionIndex,
            answers,
            score: calculateScore(),
            isFinished,
            isLoading,
            isSavingResult,
            startTime,
            endTime,
            categories,
            startQuiz: startQuiz as (subject?: string, count?: number, chapter?: string, difficulty?: string) => Promise<void>,
            startAIQuiz,
            submitAnswer,
            nextQuestion,
            prevQuestion,
            skipQuestion,
            toggleBookmark,
            bookmarks,
            resetQuiz,
            calculateScore
        }}>
            {children}
        </QuizContext.Provider>
    )
}

export const useQuiz = () => useContext(QuizContext)
