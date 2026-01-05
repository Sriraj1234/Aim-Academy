require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const keys = [
    'GROQ_API_KEY',
    'GEMINI_API_KEY',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
];

let output = "Checking Environment Keys:\n";
keys.forEach(key => {
    if (process.env[key]) {
        output += `[OK] ${key} is set (Length: ${process.env[key].length})\n`;
    } else {
        output += `[MISSING] ${key} is NOT set!\n`;
    }
});
fs.writeFileSync('env_status.txt', output);
console.log("Status written to env_status.txt");
