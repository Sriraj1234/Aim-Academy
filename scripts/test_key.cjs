const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const rawKey = process.env.FIREBASE_PRIVATE_KEY;
console.log("Raw Key Length:", rawKey ? rawKey.length : "MISSING");

if (!rawKey) return;

const processedKey = rawKey.replace(/\\n/g, '\n');
console.log("Processed Key Length:", processedKey.length);

console.log("--- START PROCESSED KEY (First 50 chars) ---");
console.log(processedKey.substring(0, 50));
console.log("--- END PROCESSED KEY (First 50 chars) ---");

if (processedKey.startsWith('"') || processedKey.endsWith('"')) {
    console.log("WARNING: Key seems to have extra quotes!");
}

try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: processedKey,
        })
    });
    console.log("✅ Initialization Success with Processed Key");
} catch (e) {
    console.log("❌ Initialization Failed with Processed Key:", e.message);
}
