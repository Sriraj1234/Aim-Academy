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

async function countTokens() {
    try {
        const users = await db.collection('users').get();
        let total = 0;
        let withToken = 0;

        users.forEach(doc => {
            total++;
            if (doc.data().fcmToken) {
                withToken++;
            }
        });

        console.log(`Total Users: ${total}`);
        console.log(`Users with FCM Token: ${withToken}`);

        if (withToken === 0) {
            console.log("CRITICAL: No users have an FCM token. Notifications cannot be sent.");
        }
    } catch (e) {
        console.error(e);
    }
}

countTokens();
