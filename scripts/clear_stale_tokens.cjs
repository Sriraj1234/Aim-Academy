/**
 * This script clears all FCM tokens from the Firestore 'users' collection.
 * 
 * WHY: When the VAPID key changes, all existing tokens become invalid.
 * Users must re-enable notifications to get new valid tokens.
 */
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Initialize Admin SDK
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        }),
    });
}

const db = admin.firestore();

async function clearStaleTokens() {
    console.log('--- Clearing Stale FCM Tokens ---');

    const usersSnapshot = await db.collection('users').get();
    let clearedCount = 0;

    const batch = db.batch();

    usersSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.fcmToken) {
            console.log(`Clearing token for user: ${doc.id} (${data.displayName || 'No Name'})`);
            batch.update(doc.ref, {
                fcmToken: admin.firestore.FieldValue.delete(),
                notificationsEnabled: false
            });
            clearedCount++;
        }
    });

    if (clearedCount > 0) {
        await batch.commit();
        console.log(`✅ Cleared ${clearedCount} stale tokens.`);
    } else {
        console.log('No tokens found to clear.');
    }

    console.log('\nUsers will need to re-enable notifications to get new tokens.');
}

clearStaleTokens().catch(console.error);
