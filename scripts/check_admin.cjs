const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

async function check() {
    console.log("Checking Firebase Admin...");

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        console.error("❌ Missing one or more FIREBASE env vars.");
        console.log("Project ID:", !!projectId);
        console.log("Client Email:", !!clientEmail);
        console.log("Private Key:", !!privateKey);
        return;
    }

    try {
        const formattedKey = privateKey.replace(/\\n/g, '\n');
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: formattedKey,
            })
        });
        console.log("✅ Firebase Admin initialized.");

        // Try to fetch users
        console.log("Attempting to fetch users...");
        const snapshot = await admin.firestore().collection('users').limit(1).get();
        console.log(`✅ Connection successful! Found ${snapshot.size} users (limit 1).`);

    } catch (e) {
        console.error("❌ Error initializing or connecting:", e);
    }
}

check();
