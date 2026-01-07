
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminMessaging } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        // Authenticate Cron Request (Standard Vercel Cron Header)
        const authHeader = request.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //     return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        // }
        // Uncomment above for production security

        const now = Date.now();
        const thirtyMinutes = 30 * 60 * 1000;

        // 1. Find Quizzes starting in the next 30 minutes
        const quizzesSnap = await adminDb.collection('live_quizzes')
            .where('status', '==', 'scheduled')
            .where('startTime', '>=', now)
            .where('startTime', '<=', now + thirtyMinutes)
            .get();

        if (quizzesSnap.empty) {
            return NextResponse.json({ success: true, message: 'No upcoming quizzes found' });
        }

        let sentCount = 0;

        // 2. Process each quiz
        for (const quizDoc of quizzesSnap.docs) {
            const quiz = quizDoc.data();

            // Avoid duplicate sending if we flag it (optional, for now relying on strict time window)
            // Ideally we should mark 'reminderSent: true' on the quiz doc

            if (quiz.reminderSent) continue;

            // 3. Get Recipients from 'reminders' subcollection
            const remindersSnap = await quizDoc.ref.collection('reminders').get();
            if (remindersSnap.empty) continue;

            const recipientIds = remindersSnap.docs.map((doc: any) => doc.id);

            // 4. Fetch User Tokens (Assuming User profile has fcmToken)
            // This reads ALL users to match IDs. Efficient for small scale, needs optimization for large.
            // Better: Store FCM token IN the reminder doc itself when user clicks Notify Me.
            // Fallback: Query 'users' collection where docId in recipientIds (split into chunks of 10)

            const tokens: string[] = [];
            const usersRef = adminDb.collection('users');

            // Chucking logic for 'in' query (limit 10)
            const chunks = [];
            for (let i = 0; i < recipientIds.length; i += 10) {
                chunks.push(recipientIds.slice(i, i + 10));
            }

            for (const chunk of chunks) {
                const usersSnap = await usersRef.where('uid', 'in', chunk).get();
                usersSnap.docs.forEach((u: any) => {
                    const d = u.data();
                    if (d.fcmToken) tokens.push(d.fcmToken);
                });
            }

            // 5. Send Notification
            if (tokens.length > 0) {
                await adminMessaging.sendEachForMulticast({
                    tokens: tokens,
                    notification: {
                        title: `🔔 Quiz Starting Soon: ${quiz.title}`,
                        body: `The live quiz "${quiz.title}" is starting in less than 30 minutes! Get ready.`
                    },
                    data: {
                        url: `/play/live/${quizDoc.id}`,
                        type: 'live_quiz_reminder'
                    }
                });
                sentCount += tokens.length;
            }

            // 6. Mark Quiz as Notified
            await quizDoc.ref.update({ reminderSent: true });
        }

        return NextResponse.json({ success: true, sentCount });
    } catch (error) {
        console.error("Cron Error", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
