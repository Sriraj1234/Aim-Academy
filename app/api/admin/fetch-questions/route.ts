import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const board = searchParams.get('board') || 'all';
        const className = searchParams.get('class') || 'all';
        const subject = searchParams.get('subject') || 'all';
        const search = searchParams.get('search') || '';

        if (subject === 'all' && board === 'all' && className === 'all') {
            return NextResponse.json({ questions: [] });
        }

        const sn = subject !== 'all' ? subject.toLowerCase().replace(/\s+/g, '_') : null;
        let subCollectionsToQuery = [];

        if (sn) {
            subCollectionsToQuery.push(sn);
            if (sn === 'social_science') {
                subCollectionsToQuery.push('history', 'geography', 'political_science', 'economics', 'disaster_management', 'digaster_management', 'disastermanagement');
            } else if (sn === 'disaster_management') {
                subCollectionsToQuery.push('digaster_management', 'disastermanagement');
            } else if (sn === 'mathematics') {
                subCollectionsToQuery.push('maths', 'math');
            }
        } else {
            const db = getAdminDb();
            const allCollections = await db.listCollections();
            const ignored = ['users', 'live_quizzes', 'live_quiz_results', 'metadata', 'batches', 'notes', 'questions'];
            subCollectionsToQuery = allCollections.map(c => c.id).filter((id: string) => !ignored.includes(id));
            // Just some common ones in case we don't have deep traversal
            subCollectionsToQuery.push('physics', 'chemistry', 'mathematics', 'maths', 'biology', 'english', 'hindi', 'history', 'geography', 'political_science', 'economics', 'business_studies', 'accountancy', 'sanskrit', 'social_science', 'disaster_management', 'digaster_management');
        }

        let allQuestions: any[] = [];
        const boardNorm = board !== 'all' ? board.toUpperCase().trim() : null;
        const classStr = className !== 'all' ? className.toString().trim() : null;
        const searchLower = search.toLowerCase();
        
        const uniqueCollectionsToQuery = Array.from(new Set(subCollectionsToQuery));
        const db = getAdminDb();

        for (const colName of uniqueCollectionsToQuery) {
            try {
                // Fetch up to 100 per collection group
                const snap = await db.collectionGroup(colName as string).limit(300).get();
                let docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // In-memory filter to avoid complex composite index requirements
                if (boardNorm) docs = docs.filter((d: any) => (d.board || '').toUpperCase() === boardNorm);
                if (classStr) docs = docs.filter((d: any) => (d.class || '').toString() === classStr);
                if (searchLower) docs = docs.filter((d: any) => (d.question || '').toLowerCase().includes(searchLower));

                allQuestions = [...allQuestions, ...docs];
                
                if (allQuestions.length >= 300) {
                    allQuestions = allQuestions.slice(0, 300);
                    break;
                }
            } catch (e) {
                console.warn(`Query on ${colName} failed. Ignoring.`);
            }
        }

        // Deduplicate exactly matching IDs
        const uniqueQuestions = Array.from(new Map(allQuestions.map(item => [item.id, item])).values());
        
        return NextResponse.json({ questions: uniqueQuestions });
    } catch (error: any) {
        console.error('Fetch questions error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
