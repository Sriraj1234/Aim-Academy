import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const usersSnapshot = await adminDb.collection('users').get();
        const totalUsers = usersSnapshot.size;

        let eligibleUsers = 0;
        let withToken = 0;

        usersSnapshot.forEach((doc: any) => {
            const data = doc.data();
            if (data.fcmToken) {
                withToken++;
                if (data.notificationsEnabled === true) {
                    eligibleUsers++;
                }
            }
        });

        return NextResponse.json({
            totalUsers,
            eligibleUsers,
            withToken,
            debug: {
                initialized: adminDb.collection('users').id !== 'mock', // Check if not mock
                env: {
                    projectId: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Missing',
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Missing',
                    privateKey: process.env.FIREBASE_PRIVATE_KEY ? 'Set' : 'Missing'
                }
            }
        });

    } catch (error: any) {
        console.error('Error fetching notification stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}
