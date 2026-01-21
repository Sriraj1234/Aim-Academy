import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getAdminDb } from '../lib/firebase-admin';

async function fixSubscription(email: string) {
    if (!email) {
        console.error('Please provide an email address.');
        process.exit(1);
    }

    console.log(`Fixing subscription for: ${email}...`);
    const db = getAdminDb();
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
        console.error('User not found!');
        return;
    }

    const userDoc = snapshot.docs[0];
    const now = Date.now();
    // Default to 1 year for safety/generosity or 30 days? User said "pro plan", didn't specify duration.
    // "msi pro plan"? Maybe monthly. I'll give 30 days by default, or better 1 year to be safe.
    // Let's give 1 month (30 days) as standard.
    const expiry = now + (30 * 24 * 60 * 60 * 1000);

    const newSub = {
        plan: 'pro',
        status: 'active',
        startDate: now,
        expiryDate: expiry,
        autoRenew: false,
        subscriptionId: 'manual_fix_' + now,
        paymentId: 'manual_fix'
    };

    await userDoc.ref.set({
        subscription: newSub
    }, { merge: true });

    console.log('SUCCESS: Subscription updated to PRO.');
    console.log(newSub);
}

const email = process.argv[2];
fixSubscription(email).catch(err => {
    console.error("Fix Script Error:", err);
    process.exit(1);
});
