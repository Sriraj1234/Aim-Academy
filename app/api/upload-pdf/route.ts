import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary directly in this route to ensure it works
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

// Dedicated endpoint for PDF uploads - forces RAW type
export async function POST(req: NextRequest) {
    try {
        console.log("📄 PDF Upload API called");

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const folder = (formData.get('folder') as string) || 'padhaku_notes';

        if (!file) {
            console.error("❌ No file in request");
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate it's a PDF
        const fileName = file.name.toLowerCase();
        console.log(`📄 File received: ${file.name}, Size: ${file.size}, Type: ${file.type}`);

        if (!fileName.endsWith('.pdf') && file.type !== 'application/pdf') {
            return NextResponse.json({ error: "Only PDF files allowed" }, { status: 400 });
        }

        // Check Cloudinary config
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            console.error("❌ Missing Cloudinary credentials");
            return NextResponse.json({
                error: "Cloudinary not configured"
            }, { status: 500 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Create a clean public_id
        const cleanName = file.name
            .replace(/\.pdf$/i, '')
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .substring(0, 50);

        console.log(`📤 Uploading to Cloudinary as RAW: ${cleanName}`);

        const result = await new Promise<any>((resolve, reject) => {
            const safePublicId = `doc_${Date.now()}.pdf`;
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: folder,
                    resource_type: 'auto', // Smartest option: lets Cloudinary decide (usually 'image' for PDFs)
                    public_id: safePublicId,
                },
                (error, result) => {
                    if (error) {
                        console.error("❌ Cloudinary Error:", error.message);
                        reject(error);
                    } else {
                        console.log("✅ PDF Uploaded (Auto):", result?.secure_url);
                        resolve(result);
                    }
                }
            );
            uploadStream.end(buffer);
        });

        return NextResponse.json({
            url: result.secure_url,
            type: result.resource_type, // Trust Cloudinary's decision
            format: result.format,
            publicId: result.public_id,
            timestamp: Date.now() // Proof of new code
        });
    } catch (error: any) {
        console.error("❌ PDF Upload Error:", error?.message || error);
        return NextResponse.json({
            error: error?.message || "PDF upload failed",
        }, { status: 500 });
    }
}
