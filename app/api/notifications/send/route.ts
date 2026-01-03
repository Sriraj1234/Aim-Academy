import { NextRequest, NextResponse } from 'next/server';
import { adminMessaging, adminDb } from '@/lib/firebase-admin';

// Force dynamic to prevent build-time execution
export const dynamic = 'force-dynamic';

// Types for notification payloads
interface NotificationPayload {
    userId?: string;
    token?: string;
    title: string;
    body: string;
    icon?: string;
    clickAction?: string;
    data?: Record<string, string>;
}

export async function POST(request: NextRequest) {
    try {
        const payload: NotificationPayload = await request.json();

        // Validate required fields
        if (!payload.title || !payload.body) {
            return NextResponse.json(
                { error: 'Title and body are required' },
                { status: 400 }
            );
        }

        let fcmToken = payload.token;

        // If userId is provided, fetch the token from Firestore
        if (payload.userId && !fcmToken) {
            const userDoc = await adminDb.collection('users').doc(payload.userId).get();
            const userData = userDoc.data();
            fcmToken = userData?.fcmToken;

            if (!fcmToken) {
                return NextResponse.json(
                    { error: 'User does not have notifications enabled' },
                    { status: 404 }
                );
            }
        }

        if (!fcmToken) {
            return NextResponse.json(
                { error: 'FCM token or userId is required' },
                { status: 400 }
            );
        }

        // Build the message
        const message = {
            token: fcmToken,
            notification: {
                title: payload.title,
                body: payload.body,
            },
            webpush: {
                notification: {
                    icon: payload.icon || '/padhaku-192.png',
                    badge: '/padhaku-192.png',
                    vibrate: [100, 50, 100],
                },
                fcmOptions: {
                    link: payload.clickAction || '/home',
                },
            },
            data: payload.data || {},
        };

        // Send the notification
        const response = await adminMessaging.send(message);
        console.log('Notification sent successfully:', response);

        return NextResponse.json({
            success: true,
            messageId: response,
        });

    } catch (error: any) {
        console.error('Error sending notification:', error);

        // Handle specific FCM errors
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
            return NextResponse.json(
                { error: 'Invalid or expired FCM token' },
                { status: 410 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to send notification', details: error.message },
            { status: 500 }
        );
    }
}

// Helper endpoint to send bulk notifications (e.g., daily motivation)
export async function PUT(request: NextRequest) {
    try {
        const { type, title, body } = await request.json();

        // Fetch all users with notifications enabled
        const usersSnapshot = await adminDb
            .collection('users')
            .where('notificationsEnabled', '==', true)
            .get();

        const tokens: string[] = [];
        usersSnapshot.forEach(doc => {
            const token = doc.data().fcmToken;
            if (token) tokens.push(token);
        });

        if (tokens.length === 0) {
            return NextResponse.json({ success: true, sent: 0 });
        }

        // Send multicast message
        const message = {
            tokens,
            notification: {
                title,
                body,
            },
            webpush: {
                notification: {
                    icon: '/padhaku-192.png',
                    badge: '/padhaku-192.png',
                },
            },
        };

        const response = await adminMessaging.sendEachForMulticast(message);
        console.log(`Bulk notification sent: ${response.successCount} success, ${response.failureCount} failures`);

        return NextResponse.json({
            success: true,
            sent: response.successCount,
            failed: response.failureCount,
        });

    } catch (error: any) {
        console.error('Error sending bulk notification:', error);
        return NextResponse.json(
            { error: 'Failed to send bulk notification', details: error.message },
            { status: 500 }
        );
    }
}
