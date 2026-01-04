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
    const targetEmail = 'jayant.kgp81@gmail.com'; // Hardcoded for this run

    console.log(`\n--- INSPECTING USER: ${targetEmail} ---`);

    db.collection('users').where('email', '==', targetEmail).limit(1).get().then(snapshot => {
        if (snapshot.empty) {
            console.log("❌ USER NOT FOUND in 'users' collection.");
            return;
        }

        snapshot.forEach(doc => {
            const d = doc.data();
            console.log(`User ID: ${doc.id}`);
            console.log(`Display Name: ${d.displayName}`);
            console.log(`\n--- DATA FIELDS ---`);
            console.log(`Stats (Type): ${typeof d.stats} - ${d.stats ? JSON.stringify(d.stats) : 'MISSING'}`);
            console.log(`Gamification (Type): ${typeof d.gamification} - ${d.gamification ? JSON.stringify(d.gamification) : 'MISSING'}`);
            console.log(`OnboardingCompleted: ${d.onboardingCompleted}`);
            console.log(`CreatedAt: ${d.createdAt}`);

            if (!d.stats || !d.gamification) {
                console.log("\n⚠️  VERDICT: CORRUPTED PROFILE");
            } else {
                console.log("\n✅ VERDICT: DATA LOOKS HEALTHY");
            }
        });
    }).catch(e => console.error(e));

} catch (e) {
    console.error(e);
}
