const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');

    console.log('--- AGORA CHECK ---');
    console.log('AGORA_APP_ID:', content.includes('AGORA_APP_ID') ? '✅ FOUND' : '❌ MISSING');
    console.log('AGORA_APP_CERTIFICATE:', content.includes('AGORA_APP_CERTIFICATE') ? '✅ FOUND' : '❌ MISSING');
    console.log('FIREBASE_PRIVATE_KEY:', content.includes('FIREBASE_PRIVATE_KEY') ? '✅ FOUND' : '❌ MISSING');

} else {
    console.log('❌ .env.local file not found');
}
