import { NextResponse } from 'next/server';
import crypto from 'crypto';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (Singleton Pattern for Next.js)
if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined;

    if (privateKey && process.env.FIREBASE_CLIENT_EMAIL) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey
            }),
        });
    }
}

const db = admin.firestore();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            razorpay_subscription_id,
            userId,
            planId
        } = body;

        console.log("Verify Route Received:", {
            razorpay_payment_id,
            razorpay_subscription_id,
            userId,
            planId
        });

        if (!razorpay_payment_id || !razorpay_signature || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const key_secret = process.env.RAZORPAY_KEY_SECRET;
        if (!key_secret) {
            console.error("RAZORPAY_KEY_SECRET missing in server env");
            return NextResponse.json({ error: 'Server config error' }, { status: 500 });
        }

        // 1. Verify Signature
        let generated_signature = '';

        if (razorpay_subscription_id) {
            // Subscription Verification Flow
            const data = razorpay_payment_id + "|" + razorpay_subscription_id;
            generated_signature = crypto
                .createHmac('sha256', key_secret)
                .update(data)
                .digest('hex');
        } else {
            // Standard Order Verification Flow
            if (!razorpay_order_id) return NextResponse.json({ error: 'Missing Order ID' }, { status: 400 });

            generated_signature = crypto
                .createHmac('sha256', key_secret)
                .update(razorpay_order_id + "|" + razorpay_payment_id)
                .digest('hex');
        }

        if (generated_signature !== razorpay_signature) {
            return NextResponse.json({ error: 'Invalid Payment Signature' }, { status: 400 });
        }

        // 2. Update User Subscription in Firestore (Using Admin SDK)
        const now = Date.now();
        const expiry = planId === 'yearly'
            ? now + (365 * 24 * 60 * 60 * 1000)
            : now + (30 * 24 * 60 * 60 * 1000);

        const userRef = db.collection('users').doc(userId);

        await userRef.set({
            subscription: {
                plan: 'pro',
                status: 'active',
                startDate: now,
                expiryDate: expiry,
                autoRenew: !!razorpay_subscription_id,
                subscriptionId: razorpay_subscription_id || null,
                paymentId: razorpay_payment_id,
                lastPaymentDate: now
            }
        }, { merge: true });

        console.log(`User ${userId} upgraded to PRO via payment ${razorpay_payment_id} (Admin SDK)`);

        return NextResponse.json({ success: true, message: 'Subscription Activated' });

    } catch (error: any) {
        console.error("Payment Verification Error:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Verification failed',
            details: JSON.stringify(error)
        }, { status: 500 });
    }
}
