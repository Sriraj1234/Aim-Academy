/**
 * Hierarchical Firestore path helpers for the questions collection.
 *
 * Naming Convention (ALL LOWERCASE):
 *   Board:   bseb | cbse | icse | up
 *   Class:   class_10 | class_12
 *   Stream:  science | arts | commerce | general (general for class 1-10)
 *   Subject: chemistry | hindi | science | social_science
 *
 * Full path: questions/{board}/{class}/{stream}/{subject}
 */

import { collection, CollectionReference, DocumentData, Firestore } from 'firebase/firestore';

export function normalizeBoard(raw: string): string {
    const b = (raw || '').toLowerCase().trim();
    if (b === 'bihar board' || b === 'bseb') return 'bseb';
    if (b === 'cbse') return 'cbse';
    if (b === 'icse') return 'icse';
    if (b === 'up board' || b === 'up') return 'up';
    if (b === 'rbse' || b === 'rajasthan board') return 'rbse';
    return b || 'other';
}

export function normalizeClass(raw: string | number): string {
    const n = (raw || '').toString().replace(/[^0-9]/g, '');
    return n ? `class_${n}` : 'class_other';
}

export function normalizeStream(rawClass: string | number, rawStream?: string | null): string {
    const n = parseInt((rawClass || '').toString().replace(/[^0-9]/g, '') || '0', 10);
    if (n >= 11) {
        const s = (rawStream || '').toLowerCase().trim();
        if (!s || s === 'science') return 'science';
        if (s === 'arts' || s === 'art') return 'arts';
        if (s === 'commerce') return 'commerce';
        return s || 'science';
    }
    return 'general';
}

export function normalizeSubject(raw: string): string {
    return (raw || 'general').toLowerCase().trim().replace(/\s+/g, '_');
}

export function getQuestionsCollectionPath(
    board: string,
    cls: string | number,
    subject: string,
    stream?: string | null,
): string {
    return `questions/${normalizeBoard(board)}/${normalizeClass(cls)}/${normalizeStream(cls, stream)}/${normalizeSubject(subject)}`;
}

export function getQuestionsCollection(
    db: Firestore,
    board: string,
    cls: string | number,
    subject: string,
    stream?: string | null,
): CollectionReference<DocumentData> {
    return collection(db, getQuestionsCollectionPath(board, cls, subject, stream));
}
