const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });

if (!admin.apps.length) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
        if (privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
        privateKey = privateKey.replace(/\\n/g, '\n');
    }
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        })
    });
}
const db = getFirestore();

async function checkUser() {
    // Search by email since I don't have UID handy, or use a known UID if available
    const email = 'jayant.kgp81@gmail.com';
    console.log(`Searching for ${email}...`);

    const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
    if (snapshot.empty) {
        console.log("User not found via email.");
    } else {
        const d = snapshot.docs[0].data();
        console.log("User Found:", snapshot.docs[0].id);
        console.log(`Board: '${d.board}' (Type: ${typeof d.board})`);
        console.log(`Class: '${d.class}' (Type: ${typeof d.class})`);

        // Also check Stream if it exists
        console.log(`Stream: '${d.stream}' (Type: ${typeof d.stream})`);

        // simulate key generation
        const boardKey = (d.board || 'cbse').toLowerCase();
        const rawClass = (d.class || '10').toString().toLowerCase();
        const classKey = rawClass.replace('th', '').trim().split(' ')[0];
        console.log(`Generated Key: ${boardKey}_${classKey}`);
    }
}

checkUser().then(() => process.exit(0));
