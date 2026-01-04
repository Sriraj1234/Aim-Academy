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

    // Look for users missing 'gamification' field
    // Note: Firestore doesn't support "where field is missing" easily.
    // We fetch a batch and filter in memory.
    db.collection('users').limit(20).get().then(snapshot => {
        console.log(`\n--- CORRUPT USERS SCAN (First 20) ---`);
        let found = 0;
        snapshot.forEach(doc => {
            const d = doc.data();
            if (!d.stats || !d.gamification) {
                console.log(`\n❌ FOUND CORRUPT USER: ${doc.id}`);
                console.log(`Name: ${d.displayName || 'Unknown'}`);
                console.log(`Missing: ${!d.stats ? 'Stats ' : ''}${!d.gamification ? 'Gamification' : ''}`);
                found++;
            }
        });
        if (found === 0) console.log("No corrupt users found in this batch.");
    }).catch(e => console.error(e));

} catch (e) {
    console.error(e);
}
