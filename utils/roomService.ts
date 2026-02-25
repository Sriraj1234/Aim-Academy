import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, deleteField, increment, FieldValue } from 'firebase/firestore';

export interface Player {
    id: string; // This is the socket/session ID or Firestore key
    userId?: string; // The actual Auth User ID
    name: string;
    photoURL?: string;
    score: number;
    status: 'joined' | 'ready' | 'submitted';
    answers: { [key: number]: number }; // questionIndex: answerIndex
    disconnected_at?: number | null; // Timestamp when player disconnected (null = connected)
}

export interface Room {
    roomId: string;
    hostId: string;
    status: 'waiting' | 'in-progress' | 'finished';
    createdAt: FieldValue | number;
    subject: string;
    chapter: string;
    questions: Record<string, unknown>[];
    players: { [key: string]: Player };
    currentQuestionIndex: number; // For synced gameplay
    questionStartTime?: number; // Timestamp for 30s timer sync
    expiresAt: number; // Timestamp for 24h expiration
}

// Generate a random 6-digit code
const generateRoomId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createRoom = async (hostName: string, subject: string, chapter: string, questions: Record<string, unknown>[], userId?: string, photoURL?: string) => {
    // 1. Check removed: User can create multiple rooms
    const roomId = generateRoomId();
    const hostId = userId || `host-${Date.now()}`;

    const roomRef = doc(db, 'rooms', roomId);

    const initialData: Room = {
        roomId,
        hostId,
        status: 'waiting',
        createdAt: serverTimestamp(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        subject,
        chapter,
        questions,
        currentQuestionIndex: -1,
        players: {
            [hostId]: {
                id: hostId,
                userId: userId,
                name: hostName,
                photoURL: photoURL,
                score: 0,
                status: 'joined',
                answers: {}
            }
        }
    };

    await setDoc(roomRef, initialData);
    return { roomId, hostId, isExisting: false };
};

export const joinRoom = async (roomId: string, playerName: string, userId?: string, photoURL?: string) => {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
        throw new Error('Room not found');
    }

    const roomData = roomSnap.data() as Room;

    // Check Expiration (Lazy Deletion)
    if (roomData.expiresAt && Date.now() > roomData.expiresAt) {
        await deleteDoc(roomRef);
        throw new Error('Room has expired.');
    }

    // Check if player already exists (By User ID first)
    let existingPlayerEntry = Object.entries(roomData.players || {}).find(([_, p]) => userId && p.userId === userId);

    // Fallback: Check by name ONLY if no userId was provided (Legacy/Guest support)
    // If we have a userId, we DO NOT match by name, to prevent different users with same name colliding
    if (!existingPlayerEntry && !userId) {
        existingPlayerEntry = Object.entries(roomData.players || {}).find(([_, p]) => p.name === playerName);
    }

    if (roomData.status !== 'waiting') {
        // If game started, ONLY allow recovery of existing player
        if (existingPlayerEntry) {
            return { playerId: existingPlayerEntry[0] };
        }
        throw new Error('Game already started. New players cannot join.');
    }

    // Prevent duplicate joins by same user in Lobby
    if (existingPlayerEntry) {
        return { playerId: existingPlayerEntry[0] };
    }

    // Check Max Players (Limit 6)
    if (Object.keys(roomData.players || {}).length >= 6) {
        throw new Error('Room is full (Max 6 players).');
    }

    const playerId = userId || `player-${Date.now()}`;
    const newPlayer: Player = {
        id: playerId,
        userId: userId,
        name: playerName,
        photoURL: photoURL,
        score: 0,
        status: 'joined',
        answers: {}
    };

    await updateDoc(roomRef, {
        [`players.${playerId}`]: newPlayer
    });

    return { playerId };
};

export const leaveRoom = async (roomId: string, playerId: string) => {
    const roomRef = doc(db, 'rooms', roomId);
    try {
        // Optimistic check: Using getDoc first is safer but slower. 
        // Just Try/Catch the update is fine for "cleanup" operations.
        await updateDoc(roomRef, {
            [`players.${playerId}`]: deleteField()
        });
    } catch (error: unknown) {
        // Verify if error is "No document to update" (code: not-found)
        const err = error as { code?: string; toString(): string };
        if (err.code === 'not-found' || err.toString().includes('No document to update')) {
            console.warn(`Room ${roomId} already deleted. Leave action skipped.`);
            return;
        }
        throw error; // Re-throw real errors
    }
};

export const listenToRoom = (roomId: string, callback: (room: Room) => void) => {
    return onSnapshot(doc(db, 'rooms', roomId), (doc) => {
        if (doc.exists()) {
            callback(doc.data() as Room);
        }
    });
};

export const createEmptyRoom = async (hostName: string, userId: string, photoURL?: string) => {
    // 1. Check removed: User can create multiple rooms
    const roomId = generateRoomId();
    const hostId = userId;

    const roomRef = doc(db, 'rooms', roomId);

    const initialData: Room = {
        roomId,
        hostId,
        status: 'waiting',
        createdAt: serverTimestamp(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        subject: '',
        chapter: '',
        questions: [],
        currentQuestionIndex: -1,
        players: {
            [hostId]: {
                id: hostId,
                userId: userId,
                name: hostName,
                photoURL: photoURL,
                score: 0,
                status: 'joined',
                answers: {}
            }
        }
    };

    await setDoc(roomRef, initialData);
    return { roomId, isExisting: false };
};

export const updateRoomConfig = async (roomId: string, subject: string, chapter: string, questions: Record<string, unknown>[]) => {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
        subject,
        chapter,
        questions
    });
};

export const startGame = async (roomId: string) => {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
        status: 'in-progress',
        currentQuestionIndex: 0, // Start Q1
        questionStartTime: Date.now()
    });
};

export const submitAnswer = async (roomId: string, playerId: string, questionIndex: number, answerIndex: number, isCorrect: boolean) => {
    const roomRef = doc(db, 'rooms', roomId);
    const key = `players.${playerId}`;

    // Build updates object
    const updates: Record<string, unknown> = {
        [`${key}.answers.${questionIndex}`]: answerIndex,
    };

    // REAL-TIME SCORE: Add 10 points for correct answers using atomic increment
    if (isCorrect) {
        updates[`${key}.score`] = increment(10);
    }

    await updateDoc(roomRef, updates);
};

export const nextQuestion = async (roomId: string, currentIndex: number) => {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
        currentQuestionIndex: currentIndex + 1,
        questionStartTime: Date.now()
    });
};

export const endGame = async (roomId: string) => {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
        status: 'finished'
    });
};

// ─── Graceful Reconnection ─────────────────────────────────────────────────

/**
 * Mark a player as disconnected (sets a timestamp).
 * Called on beforeunload — does NOT remove the player from the room.
 * The room listener will clean up the player only after RECONNECT_GRACE_MS.
 */
export const RECONNECT_GRACE_MS = 30_000; // 30 seconds

export const markDisconnected = async (roomId: string, playerId: string) => {
    const roomRef = doc(db, 'rooms', roomId);
    try {
        await updateDoc(roomRef, {
            [`players.${playerId}.disconnected_at`]: Date.now()
        });
    } catch {
        // Room might already be gone — silently ignore
    }
};

/**
 * Clear the disconnected_at flag when a player successfully rejoins.
 */
export const rejoinRoom = async (roomId: string, playerId: string) => {
    const roomRef = doc(db, 'rooms', roomId);
    try {
        await updateDoc(roomRef, {
            [`players.${playerId}.disconnected_at`]: deleteField()
        });
    } catch {
        // Room might no longer exist
    }
};

