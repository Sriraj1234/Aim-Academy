const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('--- Test Upload to Cloudinary ---');
console.log('Cloud Name:', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);

// Create a simple test image (1x1 pixel PNG)
const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

cloudinary.uploader.upload_stream(
    {
        folder: 'batches',
        resource_type: 'auto',
        public_id: 'test_upload_' + Date.now()
    },
    (error, result) => {
        if (error) {
            console.error('❌ Upload Failed:', error.message);
            console.error('   Full Error:', error);
        } else {
            console.log('✅ Upload Successful!');
            console.log('   URL:', result.secure_url);
            console.log('   Public ID:', result.public_id);
        }
    }
).end(testImageBuffer);
