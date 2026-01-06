const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const content = fs.readFileSync(envPath, 'utf8');
const lines = content.split('\n');

console.log('--- Strict Env Validation ---');

let errors = 0;

lines.forEach((line, index) => {
    const ln = index + 1;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    if (!trimmed.includes('=')) {
        console.log(`[ERROR] Line ${ln}: Missing '=' separator. Content: "${trimmed}"`);
        errors++;
        return;
    }

    const parts = trimmed.split('=');
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();

    if (key.includes(' ')) {
        console.log(`[ERROR] Line ${ln}: Key contains spaces. Key: "${key}"`);
        errors++;
    }

    // Check for unquoted values with special chars that might break Next.js loader
    if (!val.startsWith('"') && !val.startsWith("'")) {
        if (val.includes('#')) {
            console.log(`[WARNING] Line ${ln}: Unquoted value contains '#'. This starts a comment in some parsers. Key: ${key}`);
        }
        if (val.includes(' ')) {
            console.log(`[WARNING] Line ${ln}: Unquoted value contains spaces. Key: ${key}`);
        }
    }
});

if (errors === 0) {
    console.log('No obvious syntax errors found.');
} else {
    console.log(`Found ${errors} errors.`);
}

console.log('--- Key Verification ---');
const privateKeyLine = lines.find(l => l.trim().startsWith('FIREBASE_PRIVATE_KEY='));
if (privateKeyLine) {
    console.log('Private Key Line Found.');
    const val = privateKeyLine.split('=')[1].trim();
    if (val.startsWith('"')) console.log('Private Key is Quoted.');
    else console.log('Private Key is UNQUOTED.');
} else {
    console.log('Private Key Line MISSING from file read.');
}
