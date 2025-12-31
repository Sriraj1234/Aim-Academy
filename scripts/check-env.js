const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envLocalPath = path.resolve(process.cwd(), '.env.local');

if (fs.existsSync(envLocalPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
    console.log('Keys found in .env.local:');
    Object.keys(envConfig).forEach(key => {
        const val = envConfig[key];
        console.log(`${key}: ${val ? val.substring(0, 5) + '...' : 'empty'}`);
        if (key === 'GROQ_API_KEY') {
            const cleanVal = val.trim();
            console.log(`GROQ_API_KEY length: ${cleanVal.length}`);
            console.log(`GROQ_API_KEY starts with: ${cleanVal.substring(0, 4)}`);
        }
    });
} else {
    console.log('.env.local not found');
}
