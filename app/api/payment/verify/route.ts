import { NextResponse } from 'next/server';
import crypto from 'crypto';
import * as admin from 'firebase-admin';

// Helper to get Firestore safely
const getFirestore = () => {
    if (!admin.apps.length) {
        // 1. Handle Private Key (strip quotes if user pasted them, handle newlines)
        let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.slice(1, -1);
        }
        privateKey = privateKey.replace(/\\n/g, '\n');

        // 2. Handle Project ID (Fallback to public one if server one is missing)
        const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

        // 3. Validation
        if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !projectId) {
            // Log missing keys for debugging (obscured)
            console.error("Firebase Admin Init Failed. Missing keys:", {
                hasPrivateKey: !!privateKey,
                hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
                hasProjectId: !!projectId
            });
            throw new Error("Missing FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, or FIREBASE_PROJECT_ID");
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: projectId,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey
            }),
        });
    }
    return admin.firestore();
};

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

        const db = getFirestore();
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
