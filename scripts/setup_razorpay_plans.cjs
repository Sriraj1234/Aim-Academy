const Razorpay = require('razorpay');
require('dotenv').config({ path: '.env.local' });

const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY || 'rzp_test_FqJ5XJ5XJ5XJ5X'; // Fallback for safety check
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (!process.env.RAZORPAY_KEY_ID || !key_secret) {
    console.error("❌ Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env.local");
    console.log("Please add them and try again.");
    process.exit(1);
}

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: key_secret,
});

async function createPlans() {
    console.log("🔄 Creating Razorpay Plans...");

    try {
        // 1. Monthly Plan
        const monthlyPlan = await razorpay.plans.create({
            period: "monthly",
            interval: 1,
            item: {
                name: "Padhaku Pro - Monthly",
                amount: 3900, // Amount in paise (₹39)
                currency: "INR",
                description: "Monthly access to all Pro features"
            }
        });
        console.log(`✅ Monthly Plan Created: ${monthlyPlan.id}`);

        // 2. Yearly Plan
        const yearlyPlan = await razorpay.plans.create({
            period: "yearly",
            interval: 1,
            item: {
                name: "Padhaku Pro - Yearly",
                amount: 40000, // Amount in paise (₹400)
                currency: "INR",
                description: "Yearly access to all Pro features (Best Value)"
            }
        });
        console.log(`✅ Yearly Plan Created: ${yearlyPlan.id}`);

        console.log("\n⚠️ IMPORTANT: Add these to your .env.local file:");
        console.log(`NEXT_PUBLIC_RAZORPAY_PLAN_MONTHLY=${monthlyPlan.id}`);
        console.log(`NEXT_PUBLIC_RAZORPAY_PLAN_YEARLY=${yearlyPlan.id}`);

        const fs = require('fs');
        const content = `NEXT_PUBLIC_RAZORPAY_PLAN_MONTHLY=${monthlyPlan.id}\nNEXT_PUBLIC_RAZORPAY_PLAN_YEARLY=${yearlyPlan.id}`;
        fs.writeFileSync('razorpay_plans.txt', content);
        console.log("✅ Saved to razorpay_plans.txt");

    } catch (error) {
        console.error("❌ Error creating plans:", error);
    }
}

createPlans();
