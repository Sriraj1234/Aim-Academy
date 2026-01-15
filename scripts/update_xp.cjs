
const admin = require("firebase-admin");
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config({ path: '.env.local' });
}

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined;

    if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL) {
        console.error("❌ Missing FIREBASE_PRIVATE_KEY or FIREBASE_CLIENT_EMAIL in .env.local");
        process.exit(1);
    }

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey
        }),
    });
}

const db = admin.firestore();

async function updateXP(email, newXP) {
    console.log(`🔍 Looking for user with email: ${email}...`);

    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();

        if (snapshot.empty) {
            console.log('❌ No user found with that email.');
            return;
        }

        // Should be only one user, but handle array just in case
        snapshot.forEach(async doc => {
            const userData = doc.data();
            const currentXP = userData.gamification?.xp || 0;
            const currentLevel = userData.gamification?.level || 1;

            console.log(`✅ Found User: ${userData.displayName || 'Unknown'} (UID: ${doc.id})`);
            console.log(`   Current XP: ${currentXP}`);

            // Update XP
            // Note: We might want to recalculate level too, but user just asked for XP.
            // Let's just set XP for now to be precise.

            await doc.ref.set({
                gamification: {
                    ...userData.gamification,
                    xp: newXP
                }
            }, { merge: true });

            console.log(`🎉 Success! XP updated to ${newXP} for ${email}`);
        });

    } catch (error) {
        console.error('Error updating document: ', error);
    }
}

// Config
const TARGET_EMAIL = 'jayant.kgp81@gmail.com';
const TARGET_XP = 650;

updateXP(TARGET_EMAIL, TARGET_XP);
