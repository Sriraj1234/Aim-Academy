import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getAdminDb, getInitError } from '../lib/firebase-admin';

async function checkSubscription(email: string) {
    console.log("Loading env from .env.local...");
    console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID ? "Found" : "Missing");
    console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL ? "Found" : "Missing");
    console.log("FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? "Found" : "Missing");

    if (!email) {
        console.error('Please provide an email address.');
        console.log('Usage: npx tsx scripts/check-subscription.ts <email>');
        process.exit(1);
    }

    if (!email) {
        console.error('Please provide an email address.');
        console.log('Usage: npx tsx scripts/check-subscription.ts <email>');
        process.exit(1);
    }

    console.log(`Checking subscription for: ${email}...`);

    // Initialize Admin SDK
    const db = getAdminDb();

    const initError = getInitError();
    if (initError) {
        console.error("FATAL: Firebase Admin failed to initialize:", initError);
        return;
    }

    // Find user by email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
        console.error('User not found!');
        return;
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    const output = {
        uid: userDoc.id,
        email: userData.email,
        subscription: userData.subscription || null,
        dailyLimits: userData.dailyLimits || null
    };

    console.log("JSON_OUTPUT_START");
    console.log(JSON.stringify(output, null, 2));
    console.log("JSON_OUTPUT_END");
}

const email = process.argv[2];
checkSubscription(email).catch(err => {
    console.error("Script Error:", err);
    process.exit(1);
});
