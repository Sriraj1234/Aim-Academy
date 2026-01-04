const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

async function debugSend() {
    console.log("Starting Debug Send...");

    // 1. Initialize logic (copied from lib/firebase-admin.ts idea)
    if (!admin.apps.length) {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;

        if (privateKey) {
            // Robust cleaning
            if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
                privateKey = privateKey.slice(1, -1);
            }
            privateKey = privateKey.replace(/\\n/g, '\n');
        }

        console.log("Project ID:", process.env.FIREBASE_PROJECT_ID);
        console.log("Client Email:", process.env.FIREBASE_CLIENT_EMAIL);
        // console.log("Private Key:", privateKey); // Un-comment to see key if needed

        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey,
                })
            });
            console.log("✅ Admin Initialized");
        } catch (e) {
            console.error("❌ Admin Init Error:", e.message);
            return;
        }
    }

    const db = admin.firestore();
    const messaging = admin.messaging();

    // 2. Fetch Users
    try {
        console.log("Fetching users with notificationsEnabled == true...");
        const usersSnapshot = await db.collection('users')
            .where('notificationsEnabled', '==', true)
            .get();

        console.log(`Found ${usersSnapshot.size} eligible users.`);

        const tokens = [];
        usersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.fcmToken) {
                tokens.push(data.fcmToken);
            }
        });

        console.log(`Found ${tokens.length} valid tokens.`);

        if (tokens.length === 0) {
            console.log("⚠️ No tokens found. Aborting send.");
            return;
        }

        // 3. Try Sending
        const message = {
            tokens,
            notification: {
                title: "Debug Test",
                body: "This is a test from the debug script."
            }
        };

        console.log("Attempting to send...");
        const response = await messaging.sendEachForMulticast(message);
        console.log("✅ Send Response:", JSON.stringify(response, null, 2));

        if (response.failureCount > 0) {
            console.log("❌ Failures detected:");
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.log(`Token ${idx} failed:`, resp.error);
                }
            });
        }

    } catch (e) {
        console.error("❌ Runtime Error:", e);
    }
}

debugSend();
