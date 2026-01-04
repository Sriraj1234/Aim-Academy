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
    try {
        const snapshot = await db.collection('users').limit(15).get();
        console.log(`Found ${snapshot.size} users.`);

        snapshot.forEach(doc => {
            const data = doc.data();
            const issues = [];
            if (!data.stats) issues.push('NoStats');
            if (!data.gamification) issues.push('NoGamification');
            if (data.onboardingCompleted === undefined) issues.push('NoOnboarding');

            if (issues.length > 0) {
                console.log(`[PROBLEM] ID: ${doc.id} | Name: ${data.displayName} | Issues: ${issues.join(', ')}`);
            } else {
                console.log(`[OK] ID: ${doc.id} | Name: ${data.displayName}`);
            }
        });
    } catch (e) {
        console.error("Error:", e);
    }
}

checkUsers();
