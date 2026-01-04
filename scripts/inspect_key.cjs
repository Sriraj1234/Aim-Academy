const fs = require('fs');
const path = require('path');

async function inspect() {
    try {
        const envPath = path.join(__dirname, '..', '.env.local');
        const content = fs.readFileSync(envPath, 'utf8');

        const lines = content.split('\n');
        const keyLine = lines.find(l => l.startsWith('FIREBASE_PRIVATE_KEY='));

        if (!keyLine) {
            console.log('❌ FIREBASE_PRIVATE_KEY not found in .env.local');
            return;
        }

        let rawValue = keyLine.split('=')[1] || '';
        // If it was split by first =, rejoin strictly speaking but usually key is last
        // Actually split limit is safer
        const parts = keyLine.split('=');
        parts.shift(); // remove key
        rawValue = parts.join('=');

        console.log('--- RAW VALUE FROM FILE (First 50 chars) ---');
        console.log(rawValue.substring(0, 50));
        console.log('--- RAW VALUE FROM FILE (Last 50 chars) ---');
        console.log(rawValue.substring(rawValue.length - 50));

        console.log('\n--- ANALYSIS ---');
        console.log('Length:', rawValue.length);
        console.log('Starts with quote?', rawValue.startsWith('"'));
        console.log('Ends with quote?', rawValue.endsWith('"') || rawValue.endsWith('"\r'));
        console.log('Contains literal \\n?', rawValue.includes('\\n'));
        console.log('Contains actual newline?', rawValue.includes('\n'));

        // Simulate Processing
        let processed = rawValue.trim();
        if (processed.startsWith('"') && processed.endsWith('"')) {
            processed = processed.slice(1, -1);
            console.log('Action: Stripped surrounding quotes');
        }

        const withLiteralReplaced = processed.replace(/\\n/g, '\n');
        console.log('Contains \\n after replace?', withLiteralReplaced.includes('\\n'));
        console.log('Line count after replace:', withLiteralReplaced.split('\n').length);

        console.log('--- PROCESSED START ---');
        console.log(withLiteralReplaced.substring(0, 50));

    } catch (e) {
        console.error("Error reading file:", e);
    }
}

inspect();
