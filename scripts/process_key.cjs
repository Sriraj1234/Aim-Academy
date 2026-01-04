const fs = require('fs');
const path = require('path');

const tempPath = path.join(__dirname, 'temp_key.txt');
const envPath = path.join(__dirname, '..', '.env.local');

try {
    const rawKey = fs.readFileSync(tempPath, 'utf8');

    // Process the key:
    // 1. Split by lines
    // 2. Filter empty lines
    // 3. Join with \n
    // 4. Ensure it's a single line string with literal \n characters

    const lines = rawKey.split(/\r?\n/).filter(line => line.trim() !== '');
    const cleanKey = lines.join('\\n');

    // Read .env.local
    let envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');

    const keyIndex = envLines.findIndex(l => l.startsWith('FIREBASE_PRIVATE_KEY='));

    const newLine = `FIREBASE_PRIVATE_KEY="${cleanKey}"`;

    if (keyIndex !== -1) {
        envLines[keyIndex] = newLine;
    } else {
        envLines.push(newLine);
    }

    fs.writeFileSync(envPath, envLines.join('\n'));
    console.log('✅ Successfully updated .env.local with provided key.');
    console.log('Key length:', cleanKey.length);

    // Cleanup
    fs.unlinkSync(tempPath);

} catch (e) {
    console.error('Error:', e);
}
