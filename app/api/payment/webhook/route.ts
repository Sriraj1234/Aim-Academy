import { NextResponse } from 'next/server';
import crypto from 'crypto';
import * as admin from 'firebase-admin';

// Helper to get Firestore safely (Duplicated for safety/isolation)
const getFirestore = () => {
    if (!admin.apps.length) {
        // 1. Handle Private Key
        let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.slice(1, -1);
        }
        privateKey = privateKey.replace(/\\n/g, '\n');

        // 2. Handle Project ID
        const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

        // 3. Validation
        if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !projectId) {
            console.error("Webhook: Firebase Admin Init Failed.", { hasKeys: !!privateKey });
            throw new Error("Missing FIREBASE_PRIVATE_KEY or related config");
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
        const body = await req.text(); // Get raw body for signature verification
        const signature = req.headers.get('x-razorpay-signature');
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        // 1. Security Checks
        if (!webhookSecret) {
            console.error("RAZORPAY_WEBHOOK_SECRET is missing in environment variables");
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        const generatedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(body)
            .digest('hex');

        if (generatedSignature !== signature) {
            console.error("Webhook Signature Mismatch");
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // 2. Parse Event
        const event = JSON.parse(body);
        console.log("Webhook Event Received:", event.event);

        if (event.event === 'subscription.charged') {
            const payment = event.payload.payment.entity;
            const subscription = event.payload.subscription.entity;

            const subscriptionId = subscription.id;
            const paymentId = payment.id;

            console.log(`Processing Auto-Renewal for Subscription: ${subscriptionId}`);

            // 3. Update Database
            const db = getFirestore();

            // Find user by subscription ID
            const usersRef = db.collection('users');
            const snapshot = await usersRef.where('subscription.subscriptionId', '==', subscriptionId).limit(1).get();

            if (snapshot.empty) {
                console.error(`No user found for subscription ID: ${subscriptionId}`);
                // Return 200 to Razorpay even if user not found, to stop retries (assuming manual fix might be needed)
                return NextResponse.json({ message: 'User not found, logged for review' });
            }

            const userDoc = snapshot.docs[0];
            const userData = userDoc.data();
            const userId = userDoc.id;

            // Calculate new expiry
            // We can rely on Razorpay's 'current_end' but let's be safe and extend based on plan

            // NOTE: Razorpay subscription entity has 'current_end' timestamp (seconds)
            // It's best to rely on that if available, or just add 30 days
            let newExpiry = Date.now() + (30 * 24 * 60 * 60 * 1000); // Default 30 days

            if (subscription.end_at) {
                // subscription.end_at is in seconds
                newExpiry = subscription.end_at * 1000;
            } else if (subscription.current_end) {
                newExpiry = subscription.current_end * 1000;
            }

            await userDoc.ref.set({
                subscription: {
                    ...userData.subscription,
                    status: 'active',
                    expiryDate: newExpiry,
                    lastPaymentDate: Date.now(),
                    paymentId: paymentId
                }
            }, { merge: true });

            console.log(`User ${userId} subscription auto-renewed until ${new Date(newExpiry).toISOString()}`);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
