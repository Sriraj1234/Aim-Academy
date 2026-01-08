const cloudinary = require('cloudinary').v2;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

console.log("Testing Cloudinary PDF Upload...");
console.log("Cloud Name:", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);

// Create a simple test PDF content (just some bytes for testing)
const testContent = Buffer.from("%PDF-1.4 Test PDF Content");

cloudinary.uploader.upload_stream(
    {
        folder: 'test_uploads',
        resource_type: 'raw',
        public_id: 'test_pdf_' + Date.now(),
    },
    (error, result) => {
        if (error) {
            console.error("❌ UPLOAD FAILED:");
            console.error(JSON.stringify(error, null, 2));
        } else {
            console.log("✅ UPLOAD SUCCESS!");
            console.log("URL:", result.secure_url);
            console.log("Resource Type:", result.resource_type);
        }
    }
).end(testContent);
