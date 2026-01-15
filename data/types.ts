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
    examDate?: number; // Timestamp for custom exam countdown

    // Subscription & Limits
    subscription?: {
        plan: 'free' | 'pro';
        status: 'active' | 'expired' | 'canceled';
        startDate: number;
        expiryDate?: number;
        autoRenew?: boolean;
    };
    dailyLimits?: {
        date: string; // 'YYYY-MM-DD' to track resets
        aiChatCount: number;
        flashcardGenCount: number;
        groupPlayCount: number;
        noteGenCount?: number;
        snapSolveCount?: number;
    };

    viewedVideoIds?: string[]; // Study Hub Tracking
    activeDevices?: {
        deviceId: string;
        deviceName: string;
        lastActive: number;
    }[];

    // Referral System
    referralCode?: string;      // Unique code for this user (defaults to uid)
    referredBy?: string;        // UID of the user who referred them
    referralCount?: number;     // Number of successful referrals
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
    subscription?: { plan?: string; status?: string };
    gamification?: { currentStreak?: number };
}

export interface FriendRequest {
    uid: string;
    displayName: string;
    photoURL?: string;
    email: string;
    direction: 'sent' | 'received';
    timestamp: number;
    status: 'pending';
    subscription?: { plan?: string; status?: string };
    gamification?: { currentStreak?: number };
}

export interface GameInvite {
    id: string;
    fromUid: string;
    fromName: string;
    fromPhoto?: string;
    roomId: string;
    timestamp: number;
    status?: 'pending' | 'accepted' | 'rejected';
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

export interface LiveQuiz {
    id: string;
    title: string;
    description?: string;
    type: 'global' | 'batch';
    targetBatches?: string[]; // IDs of batches if type is 'batch'
    allowedClasses?: string[]; // e.g. ['9', '10', '11']
    allowedStreams?: string[]; // e.g. ['science', 'commerce', 'arts'] - Only for 11/12
    subject?: string; // Main subject or 'Mixed'
    targetBoard?: string; // e.g. 'cbse', 'bseb', 'all'

    // Scheduling
    startTime: number; // Timestamp
    endTime: number;   // Timestamp (Quiz window closes)
    duration: number;  // In minutes (How long user has once they start)

    // Content
    questions: Question[]; // Or string[] of IDs if we want to fetch, but embedding is easier for live
    totalMarks: number;

    // Meta
    createdBy: string; // Admin or Teacher ID
    createdAt: number;
    status: 'scheduled' | 'live' | 'ended';

    // Results
    participantsCount?: number;
}

export interface LiveQuizResult {
    id: string; // result ID
    quizId: string;
    userId: string;
    userName: string;
    userPhoto?: string;

    score: number;
    accuracy: number;
    timeTaken: number; // Seconds
    submittedAt: number;

    answers: { questionId: string; selectedOption: number | null; isCorrect: boolean }[];
    rank?: number;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string; // React-icon name or identifier
    color: string;
    condition: 'pro' | 'streak_7' | 'streak_30' | 'accuracy_80' | 'quiz_master_50';
    isUnlocked?: boolean; // Hydrated at runtime
}
