const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');

try {
    let content = '';
    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
    }

    // Basic cleanup of potential BOM or binary garbage
    // This is a naive cleanup, assuming the file is mostly text but might have some bad chars
    // from previous bad writes.

    // Split into lines and filter valid-looking env vars
    const lines = content.split(/[\r\n]+/).filter(line => {
        const trimmed = line.trim();
        // Keep lines that look like KEY=VALUE or comments
        return trimmed.length > 0 && (trimmed.startsWith('#') || trimmed.includes('='));
    });

    // Remove any existing GEMINI_LIVE_API_KEY to avoid duplicates
    const cleanLines = lines.filter(line => !line.startsWith('GEMINI_LIVE_API_KEY='));

    // Add the new key
    cleanLines.push('GEMINI_LIVE_API_KEY=AIzaSyCqOkJvgggczB-7W_0NKYzHf3fNiSclpnY');

    // Join and write back
    const newContent = cleanLines.join('\n');
    fs.writeFileSync(envPath, newContent, 'utf8');

    console.log('Successfully fixed .env.local');
} catch (error) {
    console.error('Error fixing .env.local:', error);
}
