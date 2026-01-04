const admin = require('firebase-admin');
const path = require('path');

// Manually load key
try {
    const fs = require('fs');
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
        }
    });

    if (!admin.apps.length) {
        let privateKey = env.FIREBASE_PRIVATE_KEY;
        if (privateKey) privateKey = privateKey.replace(/\\n/g, '\n');

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            })
        });
    }

    const db = admin.firestore();

    // Just get the last 5 users to minimize output
    db.collection('users').limit(5).get().then(snapshot => {
        console.log(`\n--- LAST 5 USERS ---`);
        snapshot.forEach(doc => {
            const d = doc.data();
            const hasStats = !!d.stats;
            const hasGamification = !!d.gamification;
            const status = (hasStats && hasGamification) ? 'OK' : 'CORRUPT';
            console.log(`ID: ${doc.id}`);
            console.log(`Name: ${d.displayName || 'No Name'}`);
            console.log(`Status: ${status}`);
            console.log('---');
        });
    }).catch(e => console.error(e));

} catch (e) {
    console.error(e);
}
