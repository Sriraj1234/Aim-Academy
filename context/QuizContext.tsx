'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Question, CategoryData } from '@/data/types'
import { mockQuestions } from '@/data/mock'
import { db } from '@/lib/firebase'
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
    startQuiz: (subject?: string, count?: number, chapter?: string) => Promise<void>
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

    const [categories, setCategories] = useState<CategoryData>({ subjects: [], chapters: {} })

    // Fetch metadata on mount
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const docRef = doc(db, 'metadata', 'taxonomy')
                const docSnap = await getDoc(docRef)
                if (docSnap.exists()) {
                    setCategories(docSnap.data() as any)
                }
            } catch (e) {
                console.error("Failed to fetch metadata", e)
            }
        }
        fetchMetadata()
    }, [])

    const startQuiz = async (subject?: string, count: number = 20, chapter?: string) => {
        setIsLoading(true)
        setIsFinished(false)
        setIsSavingResult(false)
        setAnswers([])
        setCurrentQuestionIndex(0)
        setQuestions([])
        setStartTime(Date.now())
        setEndTime(0)

        try {
            const questionsRef = collection(db, 'questions')
            // Remove hardcoded limit(50), use the requested count
            const constraints: any[] = [limit(count)];

            // Essential Filters: Board & Class (Isolation)
            if (userProfile?.board) {
                // Ensure case consistency (Uploads are lowercase usually)
                constraints.push(where('board', '==', userProfile.board.toLowerCase()));
            }
            if (userProfile?.class) {
                // Robust check: match both "10" (string) and 10 (number)
                const cls = userProfile.class;
                constraints.push(where('class', 'in', [cls.toString(), Number(cls)]));
            }

            // Subject & Chapter Filters
            if (subject) {
                constraints.push(where('subject', '==', subject.toLowerCase()));
            }
            if (chapter) {
                constraints.push(where('chapter', '==', chapter));
            }

            // Note: Firestore requires composite indexes for multiple 'where' clauses.
            // If this fails, we might need to filter client-side or create those indexes.
            // For safety and strict isolation, server-side filtering is best.

            // NEW: Randomize by picking a random start point
            // Generate a random ID (20 chars alphanumeric, roughly mimics Firestore ID)
            const randomId = doc(collection(db, 'questions')).id;

            // Add Random Cursor to constraints
            // We use 'orderBy' on documentId to ensure we can startAt or filter by it
            const randomConstraints = [...constraints, where(documentId(), '>=', randomId), orderBy(documentId())];

            console.log("Fetching questions with constraints:", {
                board: userProfile?.board,
                class: userProfile?.class,
                subject,
                chapter,
                randomStart: randomId
            });

            let qQuery = query(questionsRef, ...randomConstraints);

            let snapshot = await getDocs(qQuery)
            let q: Question[] = []

            // If we got fewer than requested (hit end of collection), wrap around
            if (snapshot.size < count) {
                const remaining = count - snapshot.size;
                console.log(`Hit end of collection (got ${snapshot.size}), wrapping around for ${remaining} more...`);

                // Wrap around: Query from start (documentId >= ' ')
                // Reuse base constraints but reset random cursor
                const wrapConstraints = [...constraints, where(documentId(), '>=', ' '), orderBy(documentId()), limit(remaining)];
                const wrapQuery = query(questionsRef, ...wrapConstraints);
                const wrapSnap = await getDocs(wrapQuery);

                wrapSnap.forEach(doc => {
                    // Dedup: Ensure we don't add duplicates if collection is smaller than count
                    if (!snapshot.docs.some(existing => existing.id === doc.id)) {
                        q.push({ id: doc.id, ...doc.data() } as Question)
                    }
                });
            }

            snapshot.forEach(doc => {
                // Ensure we haven't already added it from wrap-around (unlikely order but safe)
                if (!q.some(existing => existing.id === doc.id)) {
                    q.push({ id: doc.id, ...doc.data() } as Question)
                }
            })

            if (snapshot.empty && !q.length) {
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

            setQuestions(q)
            setAnswers(new Array(q.length).fill(null))

        } catch (error) {
            console.error("Failed to load questions", error)
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
    }

    const nextQuestion = async () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
        } else {
            // FINISH QUIZ LOGIC
            setEndTime(Date.now())
            setIsSavingResult(true)
            try {
                await saveQuizResult()
            } catch (err) {
                console.error("Critical error saving result:", err)
            } finally {
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
                // optional: revert on failure?
            }
        }
    }

    const resetQuiz = () => {
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
                const batchPromises = mistakes.map(async (q) => {
                    if (!q.id) return;
                    const mistakeRef = doc(db, 'users', user.uid, 'mistakes', q.id);
                    await setDoc(mistakeRef, {
                        question: q.question,
                        options: q.options,
                        correctAnswer: q.correctAnswer,
                        userAnswer: answers[questions.indexOf(q)] ?? null,
                        subject: q.subject,
                        chapter: q.chapter || 'General',
                        timestamp: Date.now(),
                        difficulty: q.difficulty || 'medium'
                    }, { merge: true });
                });
                await Promise.all(batchPromises);
            }

        } catch (error) {
            console.error("Error saving quiz result:", error)
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
            startQuiz,
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
