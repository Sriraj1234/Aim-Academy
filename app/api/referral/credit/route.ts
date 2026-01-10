import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/referral/credit
 * Credits 50 XP to the referrer when a new user signs up using their referral code.
 * 
 * Body: { referrerId: string, newUserId: string }
 */
export async function POST(req: NextRequest) {
    try {
        const { referrerId, newUserId } = await req.json();

        if (!referrerId || !newUserId) {
            return NextResponse.json({ success: false, error: 'Missing referrerId or newUserId' }, { status: 400 });
        }

        // Prevent self-referral
        if (referrerId === newUserId) {
            return NextResponse.json({ success: false, error: 'Cannot refer yourself' }, { status: 400 });
        }

        const referrerRef = adminDb.collection('users').doc(referrerId);
        const referrerDoc = await referrerRef.get();

        if (!referrerDoc.exists) {
            return NextResponse.json({ success: false, error: 'Referrer not found' }, { status: 404 });
        }

        // Credit 50 XP to the referrer
        const XP_REWARD = 50;
        const currentGamification = referrerDoc.data()?.gamification || { xp: 0, level: 1 };
        const newXP = (currentGamification.xp || 0) + XP_REWARD;

        // Recalculate level: L = floor((1 + sqrt(1 + 8*XP/100)) / 2)
        const newLevel = Math.floor((1 + Math.sqrt(1 + 8 * (newXP / 100))) / 2);

        await referrerRef.update({
            'gamification.xp': newXP,
            'gamification.level': newLevel,
            referralCount: FieldValue.increment(1)
        });

        console.log(`Referral credited: ${referrerId} received ${XP_REWARD} XP for referring ${newUserId}`);

        return NextResponse.json({
            success: true,
            message: `Credited ${XP_REWARD} XP to referrer`,
            newXP,
            newLevel
        });

    } catch (error) {
        console.error('Referral credit error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
