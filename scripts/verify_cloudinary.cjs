const cloudinary = require('cloudinary').v2;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

console.log('--- Cloudinary Config Check ---');

const config = {
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
};

// Check for presence without revealing secrets
Object.entries(config).forEach(([key, val]) => {
    if (!val) {
        console.error(`❌ Missing: ${key}`);
    } else {
        console.log(`✅ Present: ${key} (Len: ${val.length})`);
    }
});

if (Object.values(config).some(v => !v)) {
    console.error('Missing required configuration. Exiting.');
    process.exit(1);
}

cloudinary.config(config);

console.log('\n--- Testing Connection (Ping) ---');
cloudinary.api.ping((error, result) => {
    if (error) {
        console.error('❌ Ping Failed:', error.message);
        if (error.code === 'ENOTFOUND') console.error('   (Network/DNS issue)');
        if (error.http_code === 401) console.error('   (Unauthorized - Check API Key/Secret)');
    } else {
        console.log('✅ Connection Successful!');
        console.log('   Status:', result.status);
    }
});
