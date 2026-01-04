const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');

try {
    let content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    let keyLineIndex = lines.findIndex(l => l.startsWith('FIREBASE_PRIVATE_KEY='));

    if (keyLineIndex === -1) {
        console.error('❌ FIREBASE_PRIVATE_KEY not found in .env.local');
        process.exit(1);
    }

    let keyLine = lines[keyLineIndex];
    let key = keyLine.substring('FIREBASE_PRIVATE_KEY='.length);

    console.log('Original Key Length:', key.length);

    // 1. Remove surrounding whitespace
    key = key.trim();

    // 2. Remove surrounding quotes (Single or Double)
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
        key = key.slice(1, -1);
    }
    // Handle case where it might be double quoted redundantly or something
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
        key = key.slice(1, -1);
    }

    // 3. Un-escape newlines (literal \n to actual newline)
    // We want the file to contain the literal \n for dotenv to parse, OR actual newlines if quoted.
    // BUT safest for dotenv usually is one line with \n literal.
    // Let's ensure it is one line with \n literal for the file writer.

    // If it has actual newlines, allow them but we want to write back as one line?
    // Actually, let's keep it as is but just fix the header/footer and ensure \n are correct.

    // Wait, if I am "Fixing" the file, I should make it standard.
    // Standard .env: KEY="-----BEGIN...\n...END-----"

    // Convert actual newlines to \n literal
    key = key.replace(/\n/g, '\\n');

    // Ensure proper headers (sometimes they get mangled)
    if (!key.includes('-----BEGIN PRIVATE KEY-----')) {
        console.error('❌ Key missing standard header');
    }

    // Re-construct the line
    const sensitiveApiLine = `FIREBASE_PRIVATE_KEY="${key}"`;

    lines[keyLineIndex] = sensitiveApiLine;

    fs.writeFileSync(envPath, lines.join('\n'));
    console.log('✅ Successfully updated .env.local with sanitized key.');

} catch (e) {
    console.error('Error:', e);
}
