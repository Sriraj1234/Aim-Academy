const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const vapidKey = envConfig.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const hardcodedKey = 'BIXVNyIxta1PgGJ0sldAJo7_4e_um_1FxIgXNTOUp7RU4quMpE1uSN0y-ZLuESg2zVHr_O9t36WjoOLZ5uISMMs';

console.log('VAPID Key Check:');
if (vapidKey) {
    console.log(`[OK] NEXT_PUBLIC_FIREBASE_VAPID_KEY is set (Length: ${vapidKey.length})`);
    console.log(`Match Hardcoded: ${vapidKey === hardcodedKey}`);
    if (vapidKey !== hardcodedKey) {
        console.log(`Key: ${vapidKey}`);
    }
} else {
    console.log('[FAIL] NEXT_PUBLIC_FIREBASE_VAPID_KEY is NOT set in .env.local');
}
