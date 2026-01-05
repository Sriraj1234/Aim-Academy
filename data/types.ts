export type Board = 'bseb' | 'cbse' | 'icse' | 'up' | 'mp' | 'maharashtra' | 'rbse' | 'jac' | 'uk' | 'wb' | 'other'
export type Language = 'english' | 'hindi'
export type Subject = string // Relaxed to allow dynamic new subjects
export type Difficulty = 'easy' | 'medium' | 'hard'
export type Class = '9' | '10' | '11' | '12'

export interface Question {
    id: string
    board: Board
    language: Language
    subject: Subject
    subSubject?: string
    mainSubject?: string // Added for bulk uploads structure
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

export interface AIMemory {
    weakSubjects: string[];
    topicsStudied: string[]; // Last 5 topics
    preferences: {
        language: 'hinglish' | 'english';
        answerLength: 'short' | 'detailed';
    };
    lastInteraction: number;
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
        totalXP?: number;
        questionsSolved?: number;
    };
    gamification?: GamificationStats;
    enrolledBatches?: string[]; // List of Batch IDs
    bookmarkedQuestions?: string[];
    aiMemory?: AIMemory; // AI Personalization Memory
    coordinates?: {
        lat: number;
        lng: number;
    };
    viewedVideoIds?: string[]; // Study Hub Tracking
    activeDevices?: {
        deviceId: string;
        deviceName: string;
        lastActive: number;
    }[];
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

export interface Note {
    id: string;
    title: string;
    subject: string;
    chapter?: string;
    class: string;
    pdfUrl: string;
    thumbnailUrl?: string;
    uploadedAt: number;
    downloadCount: number;
}

export interface VideoResource {
    id: string;
    title: string;
    description?: string;
    videoUrl: string; // Full Youtube URL
    videoId: string;  // Extracted ID
    thumbnailUrl?: string;

    // Taxonomy
    board: string;
    classLevel: string;
    subject: string;
    chapter: string;

    // Credits
    teacherName: string;
    channelName: string;

    // Metadata
    uploadedBy: string;
    createdAt: number;
    updatedAt: number;

    // Analytics & Features
    views?: number;
    hasQuiz?: boolean;
    linkedQuizChapter?: string;
}

export interface TeacherProfile {
    email: string;
    name: string;
    subject: string;
    authorizedBy: string; // Admin Email
    authorizedAt: number;
    phone?: string;
    status: 'active' | 'revoked';
}

export interface Batch {
    id: string;
    name: string;
    description: string;
    subjects: string[];
    startDate: string;
    endDate: string;
    status: 'active' | 'upcoming' | 'completed';
    thumbnailUrl?: string;
    price?: number;
    teacherIds: string[];
}
