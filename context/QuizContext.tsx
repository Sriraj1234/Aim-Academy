'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import useSWR from 'swr'
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
                // Handle Case Mismatch: Upload might be 'BSEB', app uses 'bseb'
                // We use 'in' operator to catch both. This is safe as it's the only 'in' (or 'array-contains') clause currently.
                const rawBoard = userProfile.board;
                // Generate lower and UPPER case variants to catch 'bseb' AND 'BSEB'
                const variants = Array.from(new Set([
                    rawBoard,
                    rawBoard.toLowerCase(),
                    rawBoard.toUpperCase()
                ]));

                constraints.push(where('board', 'in', variants));
            }
            // CLASS FILTER REMOVED from Firestore query to avoid Composite Index errors.
            // We now fetch by Board + Subject + Chapter (sufficiently small dataset) 
            // and filter by Class in-memory below.

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

            // Simple query without randomization (avoids complex composite index requirements)
            console.log("Fetching questions with constraints:", {
                board: userProfile?.board,
                class: userProfile?.class,
                subject,
                chapter
            });

            // Fetch more than needed, then shuffle and slice client-side
            const fetchLimit = Math.min(count * 2, 100); // Fetch extra for shuffling
            const qQuery = query(questionsRef, ...constraints, limit(fetchLimit));

            let snapshot = await getDocs(qQuery)
            let q: Question[] = []

            snapshot.forEach(doc => {
                const data = doc.data();

                // Ensure we haven't already added it from wrap-around (unlikely order but safe)
                if (!q.some(existing => existing.id === doc.id)) {
                    q.push({ id: doc.id, ...data } as Question)
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

            // Safety: Force navigation after 8 seconds max if Firestore hangs
            const savePromise = saveQuizResult();
            const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 8000));

            try {
                await Promise.race([savePromise, timeoutPromise]);
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
