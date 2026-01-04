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
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, onSnapshot } from 'firebase/firestore'
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

// Helper: Get or Create Device ID
const getDeviceId = () => {
    if (typeof window === 'undefined') return 'server';
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
        deviceId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
}

const getDeviceName = () => {
    if (typeof window === 'undefined') return 'Server';
    const ua = navigator.userAgent;
    if (ua.includes("Win")) return "PC (Windows)";
    if (ua.includes("Mac")) return "Mac";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("iPhone")) return "iPhone";
    return "Browser";
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let unsubscribeSnapshot: () => void;

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            setUser(user)

            // Cleanup previous snapshot listener if exists
            if (unsubscribeSnapshot) unsubscribeSnapshot();

            if (user) {
                const docRef = doc(db, 'users', user.uid);
                const deviceId = getDeviceId();
                const deviceName = getDeviceName();
                let isRegistered = false;

                try {
                    // --- STEP 1: REGISTER DEVICE (One-Time) ---
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const profileData = docSnap.data() as UserProfile;
                        let activeDevices = profileData.activeDevices || [];
                        const nowTs = Date.now();

                        // Clean stale
                        activeDevices = activeDevices.filter(d => (nowTs - d.lastActive) < 30 * 24 * 60 * 60 * 1000);

                        const existingIndex = activeDevices.findIndex(d => d.deviceId === deviceId);

                        // FIFO Logic
                        if (existingIndex !== -1) {
                            activeDevices[existingIndex].lastActive = nowTs;
                        } else {
                            if (activeDevices.length >= 2) {
                                activeDevices.sort((a, b) => a.lastActive - b.lastActive);
                                activeDevices.shift(); // Remove oldest
                            }
                            activeDevices.push({ deviceId, deviceName, lastActive: nowTs });
                        }

                        await updateDoc(docRef, { activeDevices });
                        isRegistered = true; // Mark as successfully registered in DB
                    } else {
                        // New Profile Creation handles the initial device array, so we consider it registered.
                        // (Logic handled in the else block below for new users)
                        isRegistered = true;
                    }
                } catch (e) {
                    console.error("Device registration failed", e);
                    // If we can't register, we shouldn't enforce the kick logic yet, or maybe we should?
                }

                // --- STEP 2: REAL-TIME LISTENER ---
                unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const profileData = docSnap.data() as UserProfile;

                        // --- CHECK: AM I KICKED? ---
                        // Only check if we have successfully registered at least once
                        if (isRegistered && profileData.activeDevices) {
                            const myDevice = profileData.activeDevices.find(d => d.deviceId === deviceId);
                            if (!myDevice) {
                                console.warn("Active session invalidated (Kicked by another device). Logging out...");
                                alert("You have been logged out because this account was used on another device.");
                                signOut(auth); // Trigger cleanup
                                return;
                            }
                        }

                        // --- MONTHLY RESET LOGIC ---
                        const now = new Date();
                        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const rawGamification: any = profileData.gamification || {};
                        const gamification = {
                            xp: typeof rawGamification.xp === 'number' ? rawGamification.xp : 0,
                            level: typeof rawGamification.level === 'number' ? rawGamification.level : 1,
                            currentStreak: typeof rawGamification.currentStreak === 'number' ? rawGamification.currentStreak : (rawGamification?.currentStreak ? 1 : 0),
                            lastPracticeDate: rawGamification.lastPracticeDate || null,
                            currentMonth: rawGamification.currentMonth,
                            achievements: rawGamification.achievements || []
                        };

                        if (gamification.currentMonth !== currentMonthStr) {
                            // Handle Reset
                            updateDoc(docRef, {
                                'gamification.xp': 0,
                                'gamification.level': 1,
                                'gamification.currentMonth': currentMonthStr
                            });
                            gamification.xp = 0;
                            gamification.level = 1;
                            gamification.currentMonth = currentMonthStr;
                        }

                        // Sync Retroactive Logic (Legacy Users) - Kept simple
                        if ((gamification.xp === 0 || gamification.currentStreak === 0) && (profileData.stats?.quizzesTaken || 0) > 0) {
                            // Call a separate sync function if needed, or keep inline but simpler
                            // For specific task, omitting complex sync for brevity unless requested
                        }

                        setUserProfile({ ...profileData, gamification });
                    } else {
                        // --- SAFETY CHECK (PREVENT OVERWRITE) ---
                        const creationTime = user.metadata.creationTime ? new Date(user.metadata.creationTime).getTime() : Date.now();
                        const isOldAccount = (Date.now() - creationTime) > 5 * 60 * 1000;

                        if (isOldAccount) {
                            console.error("CRITICAL: Existing user profile not found. Preventing overwrite.");
                            alert("Error loading profile. Please check your internet connection.");
                            setLoading(false);
                            return;
                        }

                        // Create New Profile
                        const now = new Date()
                        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
                        const newProfile: UserProfile = {
                            uid: user.uid,
                            email: user.email || '',
                            displayName: user.displayName || '',
                            photoURL: user.photoURL || '',
                            onboardingCompleted: false,
                            createdAt: Date.now(),
                            stats: { quizzesTaken: 0, avgScore: 0, rank: 0 },
                            gamification: {
                                xp: 0, level: 1, currentStreak: 0, lastPracticeDate: null,
                                currentMonth: currentMonthStr, achievements: []
                            },
                            activeDevices: [{
                                deviceId, deviceName, lastActive: Date.now()
                            }]
                        }
                        setDoc(docRef, newProfile).then(() => {
                            isRegistered = true;
                            setUserProfile(newProfile);
                        });
                    }
                    setLoading(false)
                }, (error) => {
                    console.error("Snapshot error:", error);
                    setLoading(false);
                });

            } else {
                setUserProfile(null)
                setLoading(false)
            }
        })

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) unsubscribeSnapshot();
        }
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
        // New Formula: Level N requires N*100 XP. Quadratic sum.
        // L = (1 + sqrt(1 + 8*XP/100)) / 2
        const newLevel = Math.floor((1 + Math.sqrt(1 + 8 * (newXP / 100))) / 2);

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

