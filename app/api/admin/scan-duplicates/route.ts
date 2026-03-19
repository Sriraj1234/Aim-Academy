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

        // Dynamically find all subject collections
        const foundSubjectKeys = new Set<string>();
        const boardsSnap = await db.collection('questions').get();
        
        await Promise.all(boardsSnap.docs.map(async boardDoc => {
             const classes = await boardDoc.ref.listCollections();
             await Promise.all(classes.map(async classCol => {
                 const streamsSnap = await classCol.get();
                 await Promise.all(streamsSnap.docs.map(async streamDoc => {
                     const subjects = await streamDoc.ref.listCollections();
                     subjects.forEach(s => foundSubjectKeys.add(s.id));
                 }));
             }));
        }));
        
        const subjectsToScan = Array.from(foundSubjectKeys);

        const allDocs: { id: string; path: string; question: string; board: string; class: string; subject: string; chapter: string; createdAt: number }[] = [];
        let totalScanned = 0;

        // Optimized parallel scan using collectionGroup
        const scanPromises = subjectsToScan.map(async (subjectName) => {
            try {
                const snapshot = await db.collectionGroup(subjectName).get();
                if (snapshot.empty) return;

                snapshot.docs.forEach(docSnap => {
                    const path = docSnap.ref.path;
                    const segments = path.split('/');
                    
                    // Filter: questions/{board}/{class}/{stream}/{subject}/{docId}
                    if (segments[0] !== 'questions' || segments.length < 6) return;

                    const data = docSnap.data();
                    allDocs.push({
                        id: docSnap.id,
                        path: path.split('/').slice(0, -1).join('/'), // Just the collection path
                        question: data.question || '',
                        board: segments[1],
                        class: segments[2],
                        subject: segments[4],
                        chapter: data.chapter || '',
                        createdAt: data.createdAt || 0
                    });
                    totalScanned++;
                });
            } catch (err) {
                console.error(`Error scanning ${subjectName}:`, err);
            }
        });

        await Promise.all(scanPromises);

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

// Delete specific docs by full path (including doc ID)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { secret, docPaths } = body;

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
