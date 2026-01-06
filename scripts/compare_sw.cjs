const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const swPath = path.resolve(__dirname, '../public/firebase-messaging-sw.js');
const swContent = fs.readFileSync(swPath, 'utf8');

// Extract config from SW (basic regex)
const apiKeyMatch = swContent.match(/apiKey: "(.*?)"/);
const appIdMatch = swContent.match(/appId: "(.*?)"/);
const senderIdMatch = swContent.match(/messagingSenderId: "(.*?)"/);

console.log('--- Config Comparison ---');

const check = (key, envVal, swVal) => {
    if (envVal === swVal) {
        console.log(`[MATCH] ${key}`);
    } else {
        console.log(`[MISMATCH] ${key}`);
        console.log(`  Env: ${envVal}`);
        console.log(`  SW:  ${swVal}`);
    }
};

if (apiKeyMatch) check('API Key', envConfig.NEXT_PUBLIC_FIREBASE_API_KEY, apiKeyMatch[1]);
else console.log('[ERROR] Could not find apiKey in SW');

if (appIdMatch) check('App ID', envConfig.NEXT_PUBLIC_FIREBASE_APP_ID, appIdMatch[1]);
else console.log('[ERROR] Could not find appId in SW');

if (senderIdMatch) check('Sender ID', envConfig.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, senderIdMatch[1]);
else console.log('[ERROR] Could not find messagingSenderId in SW');
