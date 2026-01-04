const admin = require('firebase-admin');
const path = require('path');

// Manually load key without dotenv noise if possible, or just suppress logs
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

    db.collection('users').get().then(snapshot => {
        console.log(`\n--- USERS (${snapshot.size}) ---`);
        snapshot.forEach(doc => {
            const d = doc.data();
            const hasStats = !!d.stats;
            const hasGamification = !!d.gamification;
            const status = (hasStats && hasGamification) ? 'OK' : 'CORRUPT';
            console.log(`${doc.id} : ${status} : ${d.displayName || 'No Name'}`);
        });
    }).catch(e => console.error(e));

} catch (e) {
    console.error(e);
}
