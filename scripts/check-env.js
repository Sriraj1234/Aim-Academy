const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envLocalPath = path.resolve(process.cwd(), '.env.local');

if (fs.existsSync(envLocalPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
    console.log('Keys found in .env.local:');
    Object.keys(envConfig).forEach(key => {
        const val = envConfig[key];
        if (key.includes('CLOUDINARY') || key.includes('KEY')) {
            console.log(`${key}: ${val ? val.substring(0, 5) + '...' : 'empty'}`);
        }
    });
} else {
    console.log('.env.local not found');
}
