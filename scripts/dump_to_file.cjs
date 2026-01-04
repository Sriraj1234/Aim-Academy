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

    db.collection('users').where('email', '==', targetEmail).limit(1).get().then(snapshot => {
        if (snapshot.empty) {
            fs.writeFileSync(path.join(__dirname, 'user_dump.json'), JSON.stringify({ error: "NOT_FOUND" }));
            return;
        }
        snapshot.forEach(doc => {
            const data = doc.data();
            // Add ID to data for clarity
            data._id = doc.id;
            fs.writeFileSync(path.join(__dirname, 'user_dump.json'), JSON.stringify(data, null, 2));
            console.log("Dumped to user_dump.json");
        });
    }).catch(e => console.error(e));

} catch (e) {
    console.error(e);
}
