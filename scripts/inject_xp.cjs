const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Manually load key
try {
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
    const targetEmail = 'jayant.kgp81@gmail.com';

    db.collection('users').where('email', '==', targetEmail).limit(1).get().then(async snapshot => {
        if (snapshot.empty) {
            console.log("USER NOT FOUND");
            return;
        }

        const doc = snapshot.docs[0];
        console.log(`Found user: ${doc.id}`);

        const currentData = doc.data();
        const newGamification = {
            ...currentData.gamification,
            xp: 500,
            level: 2,
            currentStreak: 5,
            lastPracticeDate: Date.now()
        };

        await db.collection('users').doc(doc.id).update({
            gamification: newGamification
        });

        console.log("✅ Injected 500 XP, Level 2, Streak 5.");
    }).catch(e => console.error(e));

} catch (e) {
    console.error(e);
}
