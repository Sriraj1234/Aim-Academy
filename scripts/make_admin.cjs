const admin = require("firebase-admin");
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    // Fallback if running from root
    dotenv.config({ path: '.env.local' });
}

if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined;

    if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL) {
        console.error("❌ Missing FIREBASE_PRIVATE_KEY or FIREBASE_CLIENT_EMAIL in .env.local");
        // Debug: Print available keys (security safe)
        console.log("Available Env Keys:", Object.keys(process.env).filter(k => k.startsWith('FIREBASE_')));
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
const auth = admin.auth();

async function makeUserAdmin(email) {
    if (!email) {
        console.error("Please provide an email address.");
        process.exit(1);
    }

    try {
        console.log(`🔍 Looking for user with email: ${email}...`);
        const userRecord = await auth.getUserByEmail(email);
        const uid = userRecord.uid;

        console.log(`✅ Found User: ${userRecord.displayName} (${uid})`);

        const userRef = db.collection("users").doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            console.error("❌ User Profile Document not found in Firestore!");
            console.log("Creating basic profile...");
            await userRef.set({
                uid: uid,
                email: email,
                role: 'admin',
                displayName: userRecord.displayName || 'Admin User',
                createdAt: Date.now()
            }, { merge: true });
        } else {
            await userRef.update({
                role: "admin",
            });
        }

        console.log(`🎉 SUCCESS! User ${email} is now an ADMIN.`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

const targetEmail = process.argv[2];
makeUserAdmin(targetEmail);
