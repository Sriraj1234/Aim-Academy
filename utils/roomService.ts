import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, Timestamp, arrayUnion, deleteField } from 'firebase/firestore';

export interface Player {
    id: string; // This is the socket/session ID or Firestore key
    userId?: string; // The actual Auth User ID
    name: string;
    photoURL?: string;
    score: number;
    status: 'joined' | 'ready' | 'submitted';
    answers: { [key: number]: number }; // questionIndex: answerIndex
}

export interface Room {
    roomId: string;
    hostId: string;
    status: 'waiting' | 'in-progress' | 'finished';
    createdAt: any;
    subject: string;
    chapter: string;
    questions: any[];
    players: { [key: string]: Player };
    currentQuestionIndex: number; // For synced gameplay
    questionStartTime?: number; // Timestamp for 30s timer sync
    expiresAt: number; // Timestamp for 24h expiration
}

// Generate a random 6-digit code
const generateRoomId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createRoom = async (hostName: string, subject: string, chapter: string, questions: any[], userId?: string, photoURL?: string) => {
    const roomId = generateRoomId();
    const hostId = userId || `host-${Date.now()}`; // Use Auth ID if available, else fallback (though UI will enforce Auth)

    const roomRef = doc(db, 'rooms', roomId);

    const initialData: Room = {
        roomId,
        hostId,
        status: 'waiting',
        createdAt: serverTimestamp(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
        subject,
        chapter,
        questions,
        currentQuestionIndex: -1, // -1 means lobby
        players: {
            [hostId]: {
                id: hostId,
                userId: userId,
                name: hostName, // Removed "(Host)" suffix to keep name clean
                photoURL: photoURL,
                score: 0,
                status: 'joined',
                answers: {}
            }
        }
    };

    await setDoc(roomRef, initialData);
    return { roomId, hostId };
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

    // Check if player already exists (By User ID first, then Name)
    let existingPlayerEntry = Object.entries(roomData.players || {}).find(([_, p]) => userId && p.userId === userId);

    // Fallback: Check by name if no ID matched (or for legacy anonymous joiners)
    if (!existingPlayerEntry) {
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
    await updateDoc(roomRef, {
        [`players.${playerId}`]: deleteField()
    });
};

export const listenToRoom = (roomId: string, callback: (room: Room) => void) => {
    return onSnapshot(doc(db, 'rooms', roomId), (doc) => {
        if (doc.exists()) {
            callback(doc.data() as Room);
        }
    });
};

export const createEmptyRoom = async (hostName: string, userId: string, photoURL?: string) => {
    const roomId = generateRoomId();
    const hostId = userId;

    const roomRef = doc(db, 'rooms', roomId);

    const initialData: Room = {
        roomId,
        hostId,
        status: 'waiting', // Using waiting to be compatible with existing logic, but with empty subject
        createdAt: serverTimestamp(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        subject: '', // Empty initially
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
    return { roomId };
};

export const updateRoomConfig = async (roomId: string, subject: string, chapter: string, questions: any[]) => {
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
    // Note: Complex nested updates can be tricky in dot notation, ensuring we don't overwrite
    // Ideally we transaction this, but for simplicity:
    const key = `players.${playerId}`;

    // We need to read first to increment score safely, or use FieldValue.increment
    // For MVP, we'll assume local optimistic update or simple writes
    // Let's just update the specific fields

    // Check if correct to update score
    // This is better done server-side or via transaction, but client-side is faster for MVP
    // We will trust the client for now (FRIENDS mode)

    await updateDoc(roomRef, {
        [`${key}.answers.${questionIndex}`]: answerIndex,
        // We can't conditionally increment in one go easily without knowing current score if we want to be pure atomic
        // But we can use multiple update calls or just accept last write wins
    });

    // Separate call for score to use atomic increment if possible, 
    // or just read-modify-write in the component. 
    // Let's leave score calc to the end or perform a transaction in a more advanced update
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
