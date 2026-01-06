const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const senderId = envConfig.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const projectId = envConfig.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

console.log(`Project ID: ${projectId}`);
console.log(`Sender ID: ${senderId}`);

const swSenderId = "134379665002";
if (senderId === swSenderId) {
    console.log("[MATCH] Env Sender ID matches Service Worker Sender ID.");
} else {
    console.log(`[MISMATCH] Env Sender ID (${senderId}) != SW Sender ID (${swSenderId})`);
}
