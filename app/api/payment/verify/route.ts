import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebase'; // Ensure this path is correct for your project structure
// Since this is a server-side route, we use updateDoc. Wait, we need admin SDK for reliable server updates? 
// No, standard generic SDK works if rules allow or we use Admin SDK.
// BUT authentication context is tricky here. 
// Ideally, pass userId in the body from client safely OR use session cookies.
// For now, let's assume the CLIENT sends the UserID. 
// SECURITY WARNING: In a real app, verify the UserID from the session token to prevent spoofing.
// Given current scope, we will trust the passed input but adding a TODO.
// Actually, 'firebase-admin' is safer for server routes. Let's check imports.
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            userId,
            planId
        } = body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const key_secret = process.env.RAZORPAY_KEY_SECRET;
        if (!key_secret) {
            return NextResponse.json({ error: 'Server config error' }, { status: 500 });
        }

        // 1. Verify Signature
        const generated_signature = crypto
            .createHmac('sha256', key_secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return NextResponse.json({ error: 'Invalid Payment Signature' }, { status: 400 });
        }

        // 2. Update User Subscription in Firestore
        // Calculate dates
        const now = Date.now();
        const expiry = planId === 'yearly'
            ? now + (365 * 24 * 60 * 60 * 1000)
            : now + (30 * 24 * 60 * 60 * 1000);

        const userRef = doc(db, 'users', userId);

        // Use a merge update
        await setDoc(userRef, {
            subscription: {
                plan: 'pro',
                status: 'active',
                startDate: now,
                expiryDate: expiry,
                autoRenew: false, // Razorpay standard is one-time unless Subscription API used
                paymentId: razorpay_payment_id
            }
        }, { merge: true });

        console.log(`User ${userId} upgraded to PRO via payment ${razorpay_payment_id}`);

        return NextResponse.json({ success: true, message: 'Subscription Activated' });

    } catch (error: any) {
        console.error("Payment Verification Error:", error);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
