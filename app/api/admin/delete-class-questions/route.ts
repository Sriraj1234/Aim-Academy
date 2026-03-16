import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
    collection, getDocs, writeBatch, doc, getDoc, setDoc, collectionGroup
} from 'firebase/firestore';

export const dynamic = 'force-dynamic';

// ── DELETE all questions for a given class number across all boards ────────────
// POST /api/admin/delete-class-questions
// Body: { classNum: "10", secret: "padhaku-admin-2024" }
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { classNum, secret } = body;

        const adminSecret = process.env.ADMIN_SECRET || 'padhaku-admin-2024';
        if (secret !== adminSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!classNum) {
            return NextResponse.json({ error: 'classNum is required (e.g. "10")' }, { status: 400 });
        }

        const classKey = `Class ${classNum}`; // e.g. "Class 10"
        const classNumInt = parseInt(classNum);
        const boards = ['BSEB', 'CBSE', 'ICSE', 'UP', 'Other'];
        const streams = classNumInt >= 11
            ? ['Science', 'Commerce', 'Arts', 'general']
            : ['general'];
        const subjects = [
            'maths', 'mathematics', 'science', 'physics', 'chemistry', 'biology',
            'history', 'geography', 'civics', 'economics', 'hindi', 'english',
            'sanskrit', 'social_science', 'social science', 'political_science',
            'political science', 'disaster_management', 'disaster management',
            'accountancy', 'business_studies', 'business studies',
            'computer_science', 'computer science',
        ];

        let totalDeleted = 0;
        const deletedPaths: string[] = [];

        for (const board of boards) {
            for (const stream of streams) {
                for (const subject of subjects) {
                    const colPath = `questions/${board}/${classKey}/${stream}/${subject}`;
                    try {
                        const snap = await getDocs(collection(db, colPath));
                        if (snap.empty) continue;

                        // Firestore client batches are limited to 500 ops
                        const batchSize = 500;
                        for (let i = 0; i < snap.docs.length; i += batchSize) {
                            const batch = writeBatch(db);
                            snap.docs.slice(i, i + batchSize).forEach(d => batch.delete(d.ref));
                            await batch.commit();
                        }

                        totalDeleted += snap.size;
                        deletedPaths.push(`${colPath} (${snap.size})`);
                    } catch {
                        // Sub-collection doesn't exist — skip silently
                    }
                }
            }
        }

        // Clean taxonomy metadata — remove keys ending in _<classNum>
        try {
            const metaRef = doc(db, 'metadata', 'taxonomy');
            const metaSnap = await getDoc(metaRef);
            if (metaSnap.exists()) {
                const data = metaSnap.data() as Record<string, any>;
                let changed = false;
                Object.keys(data).forEach(key => {
                    if (key.endsWith(`_${classNum}`)) {
                        delete data[key];
                        changed = true;
                    }
                });
                if (changed) await setDoc(metaRef, data);
            }
        } catch (e) {
            console.warn('Taxonomy cleanup warning:', e);
        }

        return NextResponse.json({
            success: true,
            message: `Deleted ${totalDeleted} questions from Class ${classNum} across all boards.`,
            totalDeleted,
            deletedPaths,
        });

    } catch (err: any) {
        console.error('delete-class-questions error:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
