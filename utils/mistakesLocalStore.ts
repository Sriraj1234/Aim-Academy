export interface LocalMistake {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    userAnswer: string | null;
    explanation?: string;
    subject?: string;
    chapter?: string;
    timestamp: number;
    userId: string;
}

const STORAGE_KEY_PREFIX = 'aim_mistakes_v1_';

export const mistakesLocalStore = {
    // Save a new mistake
    saveMistake: (userId: string, mistake: Omit<LocalMistake, 'timestamp' | 'userId'>) => {
        if (!userId) return;
        try {
            const key = `${STORAGE_KEY_PREFIX}${userId}`;
            const existing = mistakesLocalStore.getMistakes(userId);

            // Avoid duplicates (by ID)
            if (existing.some(m => m.id === mistake.id)) return;

            const newMistake: LocalMistake = {
                ...mistake,
                userId,
                timestamp: Date.now()
            };

            const updated = [newMistake, ...existing].slice(0, 100); // Limit to 100 most recent
            localStorage.setItem(key, JSON.stringify(updated));
        } catch (e) {
            console.error("Failed to save mistake locally:", e);
        }
    },

    // Get all mistakes for user
    getMistakes: (userId: string): LocalMistake[] => {
        if (!userId) return [];
        try {
            const key = `${STORAGE_KEY_PREFIX}${userId}`;
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error("Failed to load mistakes locally:", e);
            return [];
        }
    },

    // Remove a mistake
    removeMistake: (userId: string, mistakeId: string) => {
        if (!userId) return;
        try {
            const key = `${STORAGE_KEY_PREFIX}${userId}`;
            const existing = mistakesLocalStore.getMistakes(userId);
            const updated = existing.filter(m => m.id !== mistakeId);
            localStorage.setItem(key, JSON.stringify(updated));
        } catch (e) {
            console.error("Failed to remove mistake locally:", e);
        }
    },

    // Clear all mistakes
    clearMistakes: (userId: string) => {
        if (!userId) return;
        try {
            const key = `${STORAGE_KEY_PREFIX}${userId}`;
            localStorage.removeItem(key);
        } catch (e) {
            console.error("Failed to clear mistakes locally:", e);
        }
    }
};
