import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { generateQuestionId } from '@/utils/idGenerator';

export const dynamic = 'force-dynamic';

const ADMIN_SECRET = 'padhaku-admin-2024';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== ADMIN_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const db = getAdminDb();

        // Scan all known question paths using collectionGroup via subcollection enumeration
        const boards = ['BSEB', 'CBSE', 'UP', 'ICSE'];
        const classes = ['Class 9', 'Class 10', 'Class 11', 'Class 12'];
        const streams = ['general', 'Science', 'Commerce', 'Arts'];
        const subjects = [
            'science', 'physics', 'chemistry', 'biology',
            'math', 'mathematics', 'hindi', 'english', 'sanskrit',
            'history', 'geography', 'political_science', 'economics',
            'disaster_management', 'social_science', 'civics',
            'maths', 'social_studies'
        ];

        const allDocs: { id: string; path: string; question: string; board: string; class: string; subject: string; chapter: string; createdAt: number }[] = [];
        let totalScanned = 0;

        for (const board of boards) {
            for (const cls of classes) {
                for (const stream of streams) {
                    for (const sub of subjects) {
                        const colPath = `questions/${board}/${cls}/${stream}/${sub}`;
                        try {
                            const snapshot = await db.collection(colPath).get();
                            if (snapshot.empty) continue;

                            snapshot.docs.forEach(docSnap => {
                                const data = docSnap.data();
                                allDocs.push({
                                    id: docSnap.id,
                                    path: colPath,
                                    question: data.question || '',
                                    board: data.board || board,
                                    class: data.class || cls,
                                    subject: data.subject || sub,
                                    chapter: data.chapter || '',
                                    createdAt: data.createdAt || 0
                                });
                                totalScanned++;
                            });
                        } catch {
                            // Skip inaccessible paths
                        }
                    }
                }
            }
        }

        // Group by content hash (question text + board + class + subject)
        const groups: Record<string, typeof allDocs> = {};

        allDocs.forEach(doc => {
            const contentId = generateQuestionId(
                doc.question,
                doc.board,
                doc.class,
                doc.subject
            );
            if (!groups[contentId]) groups[contentId] = [];
            groups[contentId].push(doc);
        });

        // Find duplicates (groups with more than 1)
        const duplicates: Record<string, typeof allDocs> = {};
        let dupCount = 0;

        Object.entries(groups).forEach(([key, list]) => {
            if (list.length > 1) {
                // Sort newest first
                duplicates[key] = list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                dupCount += list.length;
            }
        });

        return NextResponse.json({
            success: true,
            totalScanned,
            duplicateGroups: Object.keys(duplicates).length,
            duplicateCount: dupCount,
            duplicates
        });

    } catch (error: any) {
        console.error('Scan duplicates failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// Delete specific docs by path and ID
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { secret, action, docPaths } = body;

        if (secret !== ADMIN_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!docPaths || !Array.isArray(docPaths) || docPaths.length === 0) {
            return NextResponse.json({ error: 'No doc paths provided' }, { status: 400 });
        }

        const db = getAdminDb();
        const batch = db.batch();

        docPaths.forEach((p: string) => {
            batch.delete(db.doc(p));
        });

        await batch.commit();

        return NextResponse.json({ success: true, deleted: docPaths.length });
    } catch (error: any) {
        console.error('Delete duplicates failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
