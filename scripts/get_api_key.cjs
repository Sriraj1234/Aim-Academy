const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

console.log('FULL_API_KEY:', envConfig.NEXT_PUBLIC_FIREBASE_API_KEY);
