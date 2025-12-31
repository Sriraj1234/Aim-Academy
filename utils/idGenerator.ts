/**
 * Generates a deterministic ID for a question based on its content.
 * This helps in preventing duplicates.
 */
export function generateQuestionId(questionText: string, board: string, cls: string, subject: string): string {
    // Normalize inputs
    const q = questionText.trim().toLowerCase().replace(/\s+/g, ' ');
    const b = board.trim().toLowerCase();
    const c = cls.trim().toLowerCase();
    const s = subject.trim().toLowerCase();

    // Create a simple hash
    const str = `${b}-${c}-${s}-${q}`;

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    // Convert to hex string and ensure positive
    const hashStr = (hash >>> 0).toString(16);

    // Return a readable prefix + hash
    // Limit length to avoid extremely long IDs if we were to use full text (which we aren't, but good practice)
    return `${b}_${c}_${s}_${hashStr}`;
}
