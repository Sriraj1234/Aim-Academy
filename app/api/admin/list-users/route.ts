import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

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

        // Fetch users from Firestore (users collection)
        const snapshot = await db.collection('users')
            .orderBy('createdAt', 'desc')
            .limit(200)
            .get();

        const users = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                uid: doc.id,
                displayName: data.displayName || data.name || 'Unknown',
                email: data.email || '',
                photoURL: data.photoURL || null,
                board: data.board || '-',
                class: data.class || '-',
                createdAt: data.createdAt || 0,
                subscription: data.subscription || { plan: 'free', status: 'active' },
                role: data.role || 'user',
            };
        });

        return NextResponse.json({ success: true, users, total: users.length });
    } catch (error: any) {
        console.error('List users failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
