import { NextResponse } from 'next/server';
import { adminDb, getInitError } from '@/lib/firebase-admin';

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
                error: getInitError(),
                env: {
                    projectId: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Missing',
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Missing',
                    privateKey: process.env.FIREBASE_PRIVATE_KEY ? 'Set' : 'Missing',
                    keyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
                    keyPreview: process.env.FIREBASE_PRIVATE_KEY ? `${process.env.FIREBASE_PRIVATE_KEY.substring(0, 20)}...${process.env.FIREBASE_PRIVATE_KEY.slice(-20)}` : 'N/A'
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
