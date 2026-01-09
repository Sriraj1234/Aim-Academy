import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: Request) {
    try {
        const { planId } = await req.json();

        // 1. Validate Plan
        let amount = 0;
        if (planId === 'monthly') amount = 39;
        else if (planId === 'yearly') amount = 400;
        else return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

        // 2. Initialize Razorpay
        // Note: In production, use env vars. For now, we use placeholders or expect envs.
        const key_id = process.env.RAZORPAY_KEY_ID;
        const key_secret = process.env.RAZORPAY_KEY_SECRET;

        if (!key_id || !key_secret) {
            console.error("Razorpay Keys Missing");
            return NextResponse.json({ error: 'Server configuration error: Missing Payment Keys' }, { status: 500 });
        }

        const razorpay = new Razorpay({
            key_id: key_id,
            key_secret: key_secret,
        });

        // 3. Create Order
        const options = {
            amount: amount * 100, // Amount in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({
            id: order.id,
            currency: order.currency,
            amount: order.amount,
        });

    } catch (error: any) {
        console.error("Razorpay Order Creation Error:", error);
        return NextResponse.json({ error: error.message || 'Payment initiation failed' }, { status: 500 });
    }
}
