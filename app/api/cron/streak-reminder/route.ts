import { NextRequest, NextResponse } from 'next/server';
import { adminMessaging, adminDb } from '@/lib/firebase-admin';

// Force dynamic to prevent build-time execution
export const dynamic = 'force-dynamic';

// Vercel Cron Job for Streak Reminders
// Schedule: 8:00 AM IST (2:30 AM UTC) and 8:00 PM IST (2:30 PM UTC)

export async function GET(request: NextRequest) {
    try {
        // Verify this is a cron request (optional security)
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // In development, allow without auth
            if (process.env.NODE_ENV === 'production') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // Determine which reminder type based on current time
        const now = new Date();
        const istHour = (now.getUTCHours() + 5.5) % 24; // Convert to IST

        let title: string;
        let body: string;

        if (istHour >= 7 && istHour < 12) {
            // Morning reminder (around 8 AM)
            title = "🌅 Good Morning! Extend Your Streak! 🔥";
            body = "Nayi subah, naya josh! Aaj bhi ek question solve karo aur apna streak badhao! 💪📚";
        } else if (istHour >= 19 && istHour < 23) {
            // Evening reminder (around 8 PM)
            title = "🌙 Protect Your Streak! ⏰";
            body = "Din khatam hone wala hai! Agar aaj practice nahi ki toh streak toot jayegi! Abhi ek quiz lo! 🔥";
        } else {
            // Default (shouldn't happen with proper cron schedule)
            title = "📚 Daily Practice Reminder";
            body = "Aaj ki practice complete karo aur apna streak maintain rakho! 🎯";
        }

        // Get users who need streak reminders
        // Condition: users who haven't practiced today and have active streak
        const today = new Date().toISOString().split('T')[0];

        const usersSnapshot = await adminDb
            .collection('users')
            .where('notificationsEnabled', '==', true)
            .get();

        const tokens: string[] = [];
        const usersToNotify: string[] = [];

        usersSnapshot.forEach(doc => {
            const data = doc.data();
            const token = data.fcmToken;
            const lastPracticeDate = data.lastPracticeDate;
            const currentStreak = data.currentStreak || 0;

            // Only notify if:
            // 1. Has FCM token
            // 2. Has an active streak (> 0)
            // 3. Hasn't practiced today (or we can notify everyone)
            if (token && currentStreak > 0) {
                // Check if they practiced today
                if (lastPracticeDate !== today) {
                    tokens.push(token);
                    usersToNotify.push(doc.id);
                }
            }
        });

        if (tokens.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No users need streak reminders',
                checked: usersSnapshot.size
            });
        }

        // Send notifications
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
                    vibrate: [100, 50, 100],
                },
                fcmOptions: {
                    link: '/play/selection', // Direct to practice
                },
            },
            data: {
                type: 'streak_reminder',
                click_action: '/play/selection'
            }
        };

        const response = await adminMessaging.sendEachForMulticast(message);

        console.log(`Streak reminder sent: ${response.successCount} success, ${response.failureCount} failures`);

        return NextResponse.json({
            success: true,
            sent: response.successCount,
            failed: response.failureCount,
            totalChecked: usersSnapshot.size,
            usersNotified: usersToNotify.length,
            reminderType: istHour < 12 ? 'morning' : 'evening'
        });

    } catch (error: any) {
        console.error('Streak reminder cron error:', error);
        return NextResponse.json(
            { error: 'Cron job failed', details: error.message },
            { status: 500 }
        );
    }
}
