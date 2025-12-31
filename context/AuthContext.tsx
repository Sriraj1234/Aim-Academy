'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
    User,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { UserProfile, GamificationStats } from '@/data/types'

interface AuthContextType {
    user: User | null
    userProfile: UserProfile | null
    loading: boolean
    signInWithGoogle: () => Promise<void>
    loginWithEmail: (email: string, pass: string) => Promise<void>
    signupWithEmail: (email: string, pass: string) => Promise<void>
    logout: () => Promise<void>
    updateProfile: (data: Partial<UserProfile>) => Promise<void>
    addXP: (amount: number) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    addXP: async () => { }
} as unknown as AuthContextType)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user)
            if (user) {
                // Fetch user profile from Firestore
                const docRef = doc(db, 'users', user.uid)
                const docSnap = await getDoc(docRef)

                if (docSnap.exists()) {
                    const profileData = docSnap.data() as UserProfile

                    // Check for Monthly Reset
                    const now = new Date()
                    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` // YYYY-MM

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const rawGamification: any = profileData.gamification || {}

                    // Ensure currentStreak is always a number (fix for boolean values in DB)
                    const gamification = {
                        xp: typeof rawGamification.xp === 'number' ? rawGamification.xp : 0,
                        level: typeof rawGamification.level === 'number' ? rawGamification.level : 1,
                        currentStreak: typeof rawGamification.currentStreak === 'number'
                            ? rawGamification.currentStreak
                            : (rawGamification.currentStreak ? 1 : 0),
                        lastPracticeDate: rawGamification.lastPracticeDate || null,
                        currentMonth: rawGamification.currentMonth,
                        achievements: rawGamification.achievements || []
                    }

                    // If it's a new month, reset XP and Level
                    if (gamification.currentMonth !== currentMonthStr) {
                        console.log(`New Month Detected (${currentMonthStr}). Resetting XP.`)
                        gamification.xp = 0
                        gamification.level = 1
                        gamification.currentMonth = currentMonthStr

                        // Update Firestore immediately
                        await updateDoc(docRef, { gamification })
                    }

                    // Streak Calculation
                    const today = new Date().setHours(0, 0, 0, 0)
                    const lastPractice = gamification.lastPracticeDate
                        ? new Date(gamification.lastPracticeDate).setHours(0, 0, 0, 0)
                        : null

                    // If practiced yesterday, streak continues. If today, no change. Else reset.
                    if (lastPractice) {
                        const diffTime = today - lastPractice
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

                        if (diffDays === 1) {
                            // Streak continues (handled in addXP or here?) 
                            // Actually, streak inc should happen on ACTION (quiz complete), not just login.
                            // But broken streak should be reset on LOGIN.
                        } else if (diffDays > 1) {
                            // Streak broken
                            if (gamification.currentStreak > 0) {
                                console.log(`Streak broken. Resetting from ${gamification.currentStreak} to 0.`)
                                gamification.currentStreak = 0
                                await updateDoc(docRef, { 'gamification.currentStreak': 0 })
                            }
                        }
                    }

                    // Retroactive Sync: If user has stats but 0 XP OR 0 Streak (legacy), calculate from history
                    if ((gamification.xp === 0 || gamification.currentStreak === 0) && (profileData.stats?.quizzesTaken || 0) > 0) {
                        console.log("Legacy user detected. Syncing XP & Streak from history...");
                        // Run async to not block main thread
                        (async () => {
                            try {
                                const resultsRef = collection(db, 'users', user.uid, 'quiz_results');
                                const snapshot = await getDocs(resultsRef);
                                let totalXP = 0;

                                // Get all unique practice dates
                                const practiceDates: Set<string> = new Set()

                                snapshot.forEach(d => {
                                    const data = d.data();
                                    // Use xpEarned if available, else fallback to score
                                    totalXP += (data.xpEarned || data.score || 0);
                                    // Handle both 'date' and 'completedAt' fields
                                    const dateValue = data.date || data.completedAt;
                                    if (dateValue) {
                                        // Handle Firestore Timestamp or regular date
                                        const dateObj = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
                                        practiceDates.add(dateObj.toISOString().split('T')[0])
                                    }
                                });

                                // Calculate Streak by checking backwards from today
                                let calculatedStreak = 0;
                                const todayMs = new Date().setHours(0, 0, 0, 0)
                                let currentCheckDate = new Date(todayMs);

                                // If no practice today, check if practice yesterday exist to start streak
                                // If practice today exists, streak includes today.
                                const todayStr = currentCheckDate.toISOString().split('T')[0]

                                // Only start counting if today OR yesterday is present. Else streak is 0.
                                const yesterday = new Date(todayMs - 86400000).toISOString().split('T')[0]

                                if (practiceDates.has(todayStr) || practiceDates.has(yesterday)) {
                                    // We have an active streak. Let's count backwards.
                                    // If practiced today, start checking from today. If not but practiced yesterday, start from yesterday.

                                    // Align check date to the most recent active day
                                    if (!practiceDates.has(todayStr)) {
                                        currentCheckDate.setDate(currentCheckDate.getDate() - 1);
                                    }

                                    while (true) {
                                        const dateStr = currentCheckDate.toISOString().split('T')[0];
                                        if (practiceDates.has(dateStr)) {
                                            calculatedStreak++;
                                            currentCheckDate.setDate(currentCheckDate.getDate() - 1); // Go back 1 day
                                        } else {
                                            break; // Streak broken
                                        }
                                    }
                                }

                                if (totalXP > 0 || calculatedStreak > 0) {
                                    console.log(`Synced: Found ${totalXP} XP and ${calculatedStreak} Streak from history.`);

                                    if (gamification.xp === 0) {
                                        gamification.xp = totalXP;
                                        gamification.level = Math.floor(totalXP / 100) + 1;
                                    }

                                    // Only update streak if it's 0 (overwrite)
                                    if (gamification.currentStreak === 0) {
                                        gamification.currentStreak = calculatedStreak;
                                    }

                                    await updateDoc(docRef, { gamification });
                                    // Update local state immediately
                                    setUserProfile(prev => prev ? { ...prev, gamification } : null);
                                }
                            } catch (err) {
                                console.error("Error syncing history:", err);
                            }
                        })();
                    }

                    setUserProfile({ ...profileData, gamification })
                } else {
                    // Create new profile if it doesn't exist
                    const now = new Date()
                    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

                    const newProfile: UserProfile = {
                        uid: user.uid,
                        email: user.email || '',
                        displayName: user.displayName || '',
                        photoURL: user.photoURL || '',
                        onboardingCompleted: false,
                        createdAt: Date.now(),
                        stats: {
                            quizzesTaken: 0,
                            avgScore: 0,
                            rank: 0
                        },
                        gamification: {
                            xp: 0,
                            level: 1,
                            currentStreak: 0,
                            lastPracticeDate: null,
                            currentMonth: currentMonthStr, // Initialize with current month
                            achievements: []
                        }
                    }
                    await setDoc(docRef, newProfile)
                    setUserProfile(newProfile)
                }
            } else {
                setUserProfile(null)
            }
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider()
        try {
            await signInWithPopup(auth, provider)
        } catch (error) {
            console.error("Error signing in with Google", error)
            throw error
        }
    }

    const loginWithEmail = async (email: string, pass: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, pass)
        } catch (error) {
            console.error("Error logging in", error)
            throw error
        }
    }

    const signupWithEmail = async (email: string, pass: string) => {
        try {
            await createUserWithEmailAndPassword(auth, email, pass)
        } catch (error) {
            console.error("Error signing up", error)
            throw error
        }
    }

    const logout = async () => {
        setLoading(true)
        try {
            await signOut(auth)
            setUserProfile(null)
        } catch (error) {
            console.error("Error signing out", error)
        } finally {
            setLoading(false)
        }
    }

    const updateProfile = async (data: Partial<UserProfile>) => {
        if (!user) return
        const docRef = doc(db, 'users', user.uid)
        try {
            await updateDoc(docRef, data)
            // Update local state
            setUserProfile(prev => prev ? { ...prev, ...data } : null)
        } catch (error) {
            console.error("Error updating profile", error)
            throw error
        }
    }

    // Helper: Parse any date format to milliseconds
    const parseDate = (date: any): number | null => {
        if (!date) return null
        if (typeof date === 'number') return date
        if (date.toMillis && typeof date.toMillis === 'function') return date.toMillis() // Firestore Timestamp
        if (date instanceof Date) return date.getTime()
        if (typeof date === 'string') return new Date(date).getTime()
        return null
    }

    // Helper: Get start of day timestamp (local time)
    const getStartOfDay = (timestamp: number) => {
        const d = new Date(timestamp)
        d.setHours(0, 0, 0, 0)
        return d.getTime()
    }

    const addXP = async (amount: number) => {
        if (!user || !userProfile?.gamification) return

        const currentGamification = { ...userProfile.gamification }
        const now = Date.now()
        const todayStart = getStartOfDay(now)

        const lastPracticeMs = parseDate(currentGamification.lastPracticeDate)
        const lastPracticeStart = lastPracticeMs ? getStartOfDay(lastPracticeMs) : null

        // XP Update
        const newXP = currentGamification.xp + amount
        const newLevel = Math.floor(newXP / 100) + 1

        currentGamification.xp = newXP
        currentGamification.level = newLevel

        // Streak Logic
        if (lastPracticeStart !== todayStart) {
            // Not practiced today yet
            if (lastPracticeStart) {
                const diffTime = todayStart - lastPracticeStart
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

                if (diffDays === 1) {
                    // Consecutive day
                    currentGamification.currentStreak = (currentGamification.currentStreak || 0) + 1
                    console.log(`Streak incremented to ${currentGamification.currentStreak} 🔥`)
                } else {
                    // Missed one or more days
                    currentGamification.currentStreak = 1
                    console.log(`Streak reset to 1 (Missed ${diffDays} days)`)
                }
            } else {
                // First ever practice
                currentGamification.currentStreak = 1
                console.log(`First practice! Streak set to 1 🎉`)
            }
        } else {
            console.log(`Already practiced today. Streak remains at ${currentGamification.currentStreak}`)
        }

        currentGamification.lastPracticeDate = now

        try {
            await updateProfile({ gamification: currentGamification })
        } catch (error) {
            console.error("Error adding XP/Streak", error)
        }
    }

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, loginWithEmail, signupWithEmail, logout, updateProfile, addXP }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)

