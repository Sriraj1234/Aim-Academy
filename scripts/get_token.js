const fs = require('fs');
const configPath = 'C:\\Users\\jayan\\.config\\configstore\\firebase-tools.json';

try {
    if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf8');
        const data = JSON.parse(content);

        if (data.tokens && data.tokens.refresh_token) {
            const refreshToken = data.tokens.refresh_token;
            console.log('Refresh Token Length:', refreshToken.length);
            fs.writeFileSync(__dirname + '/token.txt', refreshToken, 'utf8');
            console.log('Full Refresh Token saved to token.txt');
        } else {
            console.log('No refresh_token found');
            console.log('Available keys:', Object.keys(data.tokens || {}));
        }
    } else {
        console.log('Config file not found');
    }
} catch (e) {
    console.error('Error:', e.message);
}
