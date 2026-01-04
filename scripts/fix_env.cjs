const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const credential = {
    FIREBASE_PROJECT_ID: "aim-83922",
    FIREBASE_CLIENT_EMAIL: "firebase-adminsdk-fbsvc@aim-83922.iam.gserviceaccount.com",
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || "YOUR_PRIVATE_KEY_HERE"
};

try {
    let content = '';
    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
    }

    const lines = content.split('\n');
    const newLines = [];
    const keysFound = new Set();

    // Preserve existing keys except the ones we are updating
    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#')) {
            newLines.push(line);
            continue;
        }

        const match = line.match(/^([^=]+)=/);
        if (match) {
            const key = match[1];
            if (credential[key]) {
                // Skip, we will add later
                continue;
            }
            newLines.push(line);
        } else {
            newLines.push(line);
        }
    }

    // Add our credentials
    newLines.push('');
    newLines.push('# Firebase Admin Credentials');
    for (const [key, value] of Object.entries(credential)) {
        newLines.push(`${key}="${value}"`);
    }

    fs.writeFileSync(envPath, newLines.join('\n'));
    console.log('Successfully updated .env.local');

} catch (e) {
    console.error('Error updating .env.local:', e);
}
