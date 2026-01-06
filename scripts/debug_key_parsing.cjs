const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

// Simulate what `process.env` would have
const rawKey = envConfig.FIREBASE_PRIVATE_KEY;

if (!rawKey) {
    console.error("Key missing in .env.local");
    process.exit(1);
}

console.log("--- Raw Key from dotenv ---");
console.log("Starts with quote?", rawKey.startsWith('"'));
console.log("Ends with quote?", rawKey.endsWith('"'));
console.log("Contains literal \\n?", rawKey.includes('\\n'));
console.log("Contains real newline?", rawKey.includes('\n'));
console.log("Preview:", rawKey.substring(0, 50));

// Logic from lib/firebase-admin.ts
let privateKey = rawKey;
console.log("\n--- Applying Parsing Logic ---");
try {
    const cleanKey = privateKey.trim();
    if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
        console.log("Detected surrounding quotes in value (Unexpected for dotenv, but checking logic)");
        if (!cleanKey.includes('\\n') && cleanKey.includes('\n')) {
            privateKey = cleanKey.slice(1, -1);
            console.log("Logic: Strip quotes only");
        } else {
            const parsed = JSON.parse(`{"key": ${cleanKey}}`);
            privateKey = parsed.key;
            console.log("Logic: JSON parse");
        }
    } else {
        console.log("Logic: Regex replace literal \\n with real newline");
        privateKey = cleanKey.replace(/\\n/g, '\n');
    }
} catch (e) {
    console.log("Logic: Fallback regex (Error caught)");
    privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
}

console.log("\n--- Resulting Key ---");
console.log("Contains literal \\n?", privateKey.includes('\\n'));
console.log("Contains real newline?", privateKey.includes('\n'));
console.log("Preview (First 60 chars):");
console.log(privateKey.substring(0, 60));
console.log("Preview (hex of first 20 chars):");
for (let i = 0; i < 20; i++) {
    process.stdout.write(privateKey.charCodeAt(i).toString(16) + " ");
}
console.log("");

// Verify PEM header strictly
if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    console.error("❌ FAILS: Missing BEGIN header");
}
const admin = require('firebase-admin');

// ... (previous code)

console.log(`Key Length: ${privateKey.length}`);
console.log(`Lines count: ${privateKey.split('\n').length}`);

try {
    const cert = admin.credential.cert({
        projectId: 'test-project',
        clientEmail: 'test@email.com',
        privateKey: privateKey
    });
    console.log("✅ Certificate creation SUCCESS check passed!");
} catch (e) {
    console.error("❌ Certificate creation FAILED:", e.message);
}

if (!envConfig.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
    console.log("⚠️ NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing in .env.local");
} else {
    console.log("✅ VAPID Key preset.");
}
