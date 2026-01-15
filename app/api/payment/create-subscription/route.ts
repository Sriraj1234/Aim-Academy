import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: Request) {
    try {
        const { planId } = await req.json();

        // 1. Get Plan ID from Env
        let razorpayPlanId = '';
        if (planId === 'monthly') razorpayPlanId = process.env.NEXT_PUBLIC_RAZORPAY_PLAN_MONTHLY || '';
        else if (planId === 'yearly') razorpayPlanId = process.env.NEXT_PUBLIC_RAZORPAY_PLAN_YEARLY || '';

        if (!razorpayPlanId) {
            return NextResponse.json({ error: 'Invalid Plan Configuration' }, { status: 400 });
        }

        // 2. Initialize Razorpay
        const key_id = process.env.RAZORPAY_KEY_ID;
        const key_secret = process.env.RAZORPAY_KEY_SECRET;

        if (!key_id || !key_secret) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const razorpay = new Razorpay({
            key_id: key_id,
            key_secret: key_secret,
        });

        // 3. Create Subscription
        // Note: Razorpay requires 'total_count' (number of billing cycles). 
        // We set a high number for "forever" (e.g., 10 years = 120 months) or explicit logic.
        // For monthly: 120 cycles (10 years)
        // For yearly: 10 cycles (10 years)
        const total_count = planId === 'monthly' ? 120 : 10;

        const subscription = await razorpay.subscriptions.create({
            plan_id: razorpayPlanId,
            total_count: total_count,
            quantity: 1,
            customer_notify: 1, // Razorpay notifies customer
            notes: {
                plan_type: planId
            }
        });

        return NextResponse.json({
            id: subscription.id,
            plan_id: subscription.plan_id,
            status: subscription.status
        });

    } catch (error: any) {
        console.error("Razorpay Subscription Creation Error:", error);
        return NextResponse.json({ error: error.message || 'Subscription initiation failed' }, { status: 500 });
    }
}
