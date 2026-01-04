const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

if (!admin.apps.length) {
    try {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (privateKey) {
            if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
            privateKey = privateKey.replace(/\\n/g, '\n');
        }
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            })
        });
    } catch (e) {
        console.error("Init Error:", e.message);
        process.exit(1);
    }
}

const db = admin.firestore();

async function checkUsers() {
    console.log('--- Checking Recent Users ---');
    try {
        // Get last 10 created or updated users
        // Note: 'createdAt' might not exist on all, so just getting a batch
        const snapshot = await db.collection('users').limit(10).get();

        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`\nUser ID: ${doc.id}`);
            console.log(`Name: ${data.displayName || 'N/A'}`);
            console.log(`Email: ${data.email || 'N/A'}`);

            // Check Critical Fields
            const hasStats = !!data.stats;
            const hasGamification = !!data.gamification;
            const hasOnboarding = data.onboardingCompleted !== undefined;

            console.log(`- Stats: ${hasStats ? 'OK' : 'MISSING ❌'}`);
            console.log(`- Gamification: ${hasGamification ? 'OK' : 'MISSING ❌'}`);
            console.log(`- Onboarding: ${hasOnboarding ? data.onboardingCompleted : 'MISSING'}`);

            if (!hasStats || !hasGamification) {
                console.log('⚠️  POTENTIAL ISSUE DETECTED');
            }
        });

    } catch (e) {
        console.error("Error fetching users:", e);
    }
}

checkUsers();
