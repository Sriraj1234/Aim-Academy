const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('GROQ_API_KEY:', content.includes('GROQ_API_KEY') ? '✅ FOUND' : '❌ MISSING');
} else {
    console.log('❌ .env.local file not found');
}
