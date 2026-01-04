const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        })
    });
}

const db = admin.firestore();

async function analyzeUsers() {
    console.log("Analyzing users for notifications...");
    try {
        const snapshot = await db.collection('users').get();
        const totalUsers = snapshot.size;
        let withToken = 0;
        let enabled = 0;
        let eligible = 0; // Both token + enabled

        console.log(`Total Users Found: ${totalUsers}`);

        snapshot.forEach(doc => {
            const data = doc.data();
            const hasToken = !!data.fcmToken;
            const isEnabled = data.notificationsEnabled === true;

            if (hasToken) withToken++;
            if (isEnabled) enabled++;
            if (hasToken && isEnabled) eligible++;
        });

        console.log(`Users with FCM Token: ${withToken}`);
        console.log(`Users with notificationsEnabled=true: ${enabled}`);
        console.log(`✅ Eligible Users for Notification: ${eligible}`);

        if (eligible === 0 && totalUsers > 0) {
            console.log("\n⚠️ Sample User Data (first one):");
            if (!snapshot.empty) {
                console.log(JSON.stringify(snapshot.docs[0].data(), null, 2));
            }
        }

    } catch (error) {
        console.error("Error fetching users:", error);
    }
}

analyzeUsers();
