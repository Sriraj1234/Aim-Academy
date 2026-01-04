const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');

try {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    const cleanLines = [];

    let inPrivateKey = false;

    lines.forEach(line => {
        const trimmed = line.trim();

        // Always keep comments
        if (trimmed.startsWith('#')) {
            cleanLines.push(line);
            return;
        }

        // Handle Private Key special case if it was multi-line (it shouldn't be now, but just in case)
        if (trimmed.startsWith('FIREBASE_PRIVATE_KEY=')) {
            // Check if it's the valid one we saved
            cleanLines.push(line);
            return;
        }

        // Valid Env Var Pattern: KEY=VALUE or KEY="VALUE"
        // We reject lines that look like garbage (e.g. starting with quotes, random chars)
        // A valid key usually starts with [A-Z_]+
        if (/^[A-Z0-9_]+=/.test(trimmed)) {
            cleanLines.push(line);
        } else if (trimmed === '') {
            cleanLines.push(line); // Keep empty lines for spacing
        } else {
            console.log('Discarding garbage line:', line.substring(0, 50));
        }
    });

    // Backup first
    fs.writeFileSync(envPath + '.bak', content);

    // Write clean
    fs.writeFileSync(envPath, cleanLines.join('\n'));
    console.log('✅ Cleaned .env.local');

} catch (e) {
    console.error('Error:', e);
}
