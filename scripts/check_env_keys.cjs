const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');

console.log('--- Checking .env.local file ---');
try {
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, i) => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const parts = trimmed.split('=');
                const key = parts[0].trim();
                const val = parts.slice(1).join('=').trim();
                // Show key name and value length/status
                console.log(`Line ${i + 1}: ${key} (Length: ${val.length})`);
                if (key === 'NEXT_PUBLIC_FIREBASE_API_KEY') {
                    console.log('   -> Found API Key in file');
                }
                if (key === 'FIREBASE_PRIVATE_KEY') {
                    console.log('   -> Found Private Key in file');
                }
            }
        });
    } else {
        console.log('❌ .env.local DOES NOT EXIST');
    }
} catch (e) {
    console.error('Error reading .env.local:', e);
}
