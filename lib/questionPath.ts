/**
 * Hierarchical Firestore path helpers for the questions collection.
 *
 * Structure:
 *  questions/{board}/{class}/{stream}/{subject}/
 *
 * Stream Rules:
 *  - Class 11 & 12 → actual stream ("Science", "Arts", "Commerce")
 *  - All other classes → "general"
 */

import { collection, CollectionReference, DocumentData, Firestore } from 'firebase/firestore';

/**
 * Normalize board name to a consistent Firestore-safe key.
 * e.g. "Bihar Board", "bseb", "BSEB" → "BSEB"
 */
export function normalizeBoard(board: string): string {
    const b = (board || '').toLowerCase().trim();
    if (b === 'bihar board' || b === 'bseb') return 'BSEB';
    if (b === 'cbse') return 'CBSE';
    if (b === 'icse') return 'ICSE';
    if (b === 'up board' || b === 'up') return 'UP';
    if (b === 'rajasthan board' || b === 'rbse') return 'RBSE';
    // Fallback: Title-case the original
    return board.trim();
}

/**
 * Normalize class to consistent format.
 * e.g. "Class 12", "12", "class12" → "Class 12"
 */
export function normalizeClass(cls: string): string {
    const c = (cls || '').toLowerCase().replace(/[^0-9]/g, '');
    if (!c) return cls.trim();
    return `Class ${c}`;
}

/**
 * Returns the stream segment for a given class.
 * For Class 11 & 12, uses the provided stream (defaulting to 'Science').
 * For all other classes, returns 'general'.
 */
export function resolveStream(cls: string, stream?: string | null): string {
    const normalized = normalizeClass(cls);
    const level = parseInt(normalized.replace(/\D/g, '') || '0', 10);
    if (level >= 11) {
        return (stream || 'Science').trim();
    }
    return 'general';
}

/**
 * Returns the full Firestore collection path for a given set of parameters.
 * e.g. "questions/BSEB/Class 12/Science/Chemistry"
 */
export function getQuestionsCollectionPath(
    board: string,
    cls: string,
    subject: string,
    stream?: string | null,
): string {
    const b = normalizeBoard(board);
    const c = normalizeClass(cls);
    const s = resolveStream(cls, stream);
    return `questions/${b}/${c}/${s}/${subject.trim()}`;
}

/**
 * Returns a Firestore CollectionReference for questions given board, class, subject, stream.
 */
export function getQuestionsCollection(
    db: Firestore,
    board: string,
    cls: string,
    subject: string,
    stream?: string | null,
): CollectionReference<DocumentData> {
    const path = getQuestionsCollectionPath(board, cls, subject, stream);
    return collection(db, path);
}
