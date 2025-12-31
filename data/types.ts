export type Board = 'bseb' | 'cbse' | 'icse' | 'up' | 'mp' | 'maharashtra' | 'rbse' | 'jac' | 'uk' | 'wb' | 'other'
export type Language = 'english' | 'hindi'
export type Subject = 'physics' | 'chemistry' | 'biology' | 'mathematics' | 'history' | 'geography' | 'economics' | 'political science' | 'social science' | 'disaster management'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type Class = '9' | '10' | '11' | '12'

export interface Question {
    id: string
    board: Board
    language: Language
    subject: Subject
    subSubject?: string
    class: Class
    year: number
    question: string
    options: string[]
    correctAnswer: number
    chapter: string
    topic: string
    difficulty: Difficulty
    marks: number
    questionType: 'mcq' | 'short' | 'long' | 'numerical'
    explanation: string
    solutionSteps?: string[]
    formulaText?: string
    tags: string[]

    // Auto-Translation Fields
    questionHi?: string
    optionsHi?: string[]
    explanationHi?: string
}

export interface User {
    id: string
    email: string
    name: string
    board: Board
    language: Language
    class: Class
    avatar?: string
}

export interface QuizSession {
    id: string
    userId?: string
    board: Board
    subject: Subject
    questions: Question[]
    selectedAnswers: (number | null)[]
    startTime: Date
    endTime?: Date
    totalTime: number
}

export interface QuizResult {
    sessionId: string
    score: number
    totalMarks: number
    accuracy: number
    correctAnswers: number
    totalQuestions: number
    timeSpent: number
    chapter: string
    weakAreas: string[]
    strongAreas: string[]
}

export interface GamificationStats {
    xp: number;
    level: number;
    currentStreak: number;
    lastPracticeDate: number | null; // Timestamp
    currentMonth?: string; // Format: 'YYYY-MM' for monthly reset tracking
    achievements: string[];
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    board?: string;
    class?: string;
    stream?: string;
    pincode?: string;
    locality?: string;
    city?: string;
    state?: string;
    onboardingCompleted: boolean;
    createdAt: number;
    stats?: {
        quizzesTaken: number;
        avgScore: number;
        rank: number;
    };
    gamification?: GamificationStats;
    coordinates?: {
        lat: number;
        lng: number;
    };
}

export interface BattleRoom {
    id: string
    code: string
    creatorId: string
    subject: Subject
    difficulty: Difficulty
    questionCount: number
    participants: User[]
    status: 'waiting' | 'active' | 'completed'
    currentQuestion: number
}

// Metadata Types
export interface ChapterInfo {
    name: string;
    count: number;
}

export interface CategoryData {
    subjects: string[];
    chapters: Record<string, ChapterInfo[]>; // ChapterInfo is { name, count }
}


export interface Friend {
    uid: string;
    displayName: string;
    photoURL?: string;
    createdAt: number;
}

export interface FriendRequest {
    uid: string;
    displayName: string;
    photoURL?: string;
    email: string;
    direction: 'sent' | 'received';
    timestamp: number;
    status: 'pending';
}

export interface GameInvite {
    id: string;
    fromUid: string;
    fromName: string;
    fromPhoto?: string;
    roomId: string;
    timestamp: number;
}

export type Taxonomy = Record<string, CategoryData>;
