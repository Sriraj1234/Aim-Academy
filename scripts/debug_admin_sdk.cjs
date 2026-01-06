const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

// Load env
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

console.log('--- Firebase Admin Debug ---');
console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
const key = process.env.FIREBASE_PRIVATE_KEY;
console.log('Private Key Length:', key ? key.length : 'MISSING');

if (!key) {
    console.error('CRITICAL: Private Key is missing!');
    process.exit(1);
}

// Handle private key formatting (common issue)
const formattedKey = key.replace(/\\n/g, '\n');

try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: formattedKey,
            }),
        });
        console.log('Firebase Admin initialized.');
    }

    const db = admin.firestore();

    db.collection('users').get()
        .then(snapshot => {
            console.log(`Successfully connected! Found ${snapshot.size} users.`);
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log(`- User ${doc.id}: Token=${data.fcmToken ? 'Yes' : 'No'}, Enabled=${data.notificationsEnabled}`);
            });
        })
        .catch(err => {
            console.error('Error fetching users:', err);
        });

} catch (error) {
    console.error('Initialization Error:', error);
}
