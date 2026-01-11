'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    increment,
    serverTimestamp,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

export interface Discussion {
    id: string;
    title: string;
    body: string;
    imageUrls?: string[];
    board: string;
    class: string;
    subject: string;
    chapter?: string;
    authorId: string;
    authorName: string;
    authorPhoto?: string;
    createdAt: Timestamp;
    upvotes: number;
    answerCount: number;
    status: 'open' | 'solved';
}

export interface Answer {
    id: string;
    body: string;
    imageUrl?: string;
    authorId: string;
    authorName: string;
    authorPhoto?: string;
    upvotes: number;
    isBestAnswer: boolean;
    isVerified: boolean;
    createdAt: Timestamp;
}

export function useDiscussions(board?: string, classLevel?: string, subject?: string) {
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, userProfile } = useAuth();

    // Use user's board/class if not specified
    const effectiveBoard = board || userProfile?.board || 'bihar';
    const effectiveClass = classLevel || userProfile?.class || '10';

    useEffect(() => {
        setLoading(true);

        let q = query(
            collection(db, 'discussions'),
            where('board', '==', effectiveBoard),
            where('class', '==', effectiveClass),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        if (subject) {
            q = query(
                collection(db, 'discussions'),
                where('board', '==', effectiveBoard),
                where('class', '==', effectiveClass),
                where('subject', '==', subject),
                orderBy('createdAt', 'desc'),
                limit(50)
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const disc: Discussion[] = [];
            snapshot.forEach(doc => {
                disc.push({ id: doc.id, ...doc.data() } as Discussion);
            });
            setDiscussions(disc);
            setLoading(false);
        }, (err) => {
            console.error('Error fetching discussions:', err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [effectiveBoard, effectiveClass, subject]);

    const createDiscussion = useCallback(async (data: {
        title: string;
        body: string;
        subject: string;
        chapter?: string;
        imageUrls?: string[];
    }) => {
        if (!user) throw new Error('You must be logged in to post.');
        if (!userProfile) throw new Error('User profile is loading. Please try again in a moment.');

        const newDiscussion = {
            ...data,
            board: userProfile.board || 'bihar',
            class: userProfile.class || '10',
            authorId: user.uid,
            authorName: user.displayName || 'Anonymous',
            authorPhoto: user.photoURL || null,
            createdAt: serverTimestamp(),
            upvotes: 0,
            answerCount: 0,
            status: 'open'
        };

        const docRef = await addDoc(collection(db, 'discussions'), newDiscussion);
        return docRef.id;
    }, [user, userProfile]);

    const upvoteDiscussion = useCallback(async (discussionId: string) => {
        const docRef = doc(db, 'discussions', discussionId);
        await updateDoc(docRef, { upvotes: increment(1) });
    }, []);

    const deleteDiscussion = useCallback(async (discussionId: string) => {
        if (!user) throw new Error('Must be logged in');
        await deleteDoc(doc(db, 'discussions', discussionId));
    }, [user]);

    return { discussions, loading, error, createDiscussion, upvoteDiscussion, deleteDiscussion };
}

export function useAnswers(discussionId: string) {
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (!discussionId) return;

        const q = query(
            collection(db, 'discussions', discussionId, 'answers'),
            orderBy('isBestAnswer', 'desc'),
            orderBy('upvotes', 'desc'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ans: Answer[] = [];
            snapshot.forEach(doc => {
                ans.push({ id: doc.id, ...doc.data() } as Answer);
            });
            setAnswers(ans);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [discussionId]);

    const addAnswer = useCallback(async (body: string, imageUrl?: string) => {
        if (!user) throw new Error('Must be logged in');

        const newAnswer = {
            body,
            imageUrl: imageUrl || null,
            authorId: user.uid,
            authorName: user.displayName || 'Anonymous',
            authorPhoto: user.photoURL || null,
            upvotes: 0,
            isBestAnswer: false,
            isVerified: false,
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'discussions', discussionId, 'answers'), newAnswer);

        // Increment answer count
        const discussionRef = doc(db, 'discussions', discussionId);
        await updateDoc(discussionRef, { answerCount: increment(1) });
    }, [user, discussionId]);

    const markBestAnswer = useCallback(async (answerId: string) => {
        const answerRef = doc(db, 'discussions', discussionId, 'answers', answerId);
        await updateDoc(answerRef, { isBestAnswer: true });

        const discussionRef = doc(db, 'discussions', discussionId);
        await updateDoc(discussionRef, { status: 'solved' });
    }, [discussionId]);

    const upvoteAnswer = useCallback(async (answerId: string) => {
        const answerRef = doc(db, 'discussions', discussionId, 'answers', answerId);
        await updateDoc(answerRef, { upvotes: increment(1) });
    }, [discussionId]);

    return { answers, loading, addAnswer, markBestAnswer, upvoteAnswer };
}
