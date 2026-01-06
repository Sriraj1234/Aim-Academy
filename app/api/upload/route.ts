import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        console.log("Creating/Uploading Batch Thumbnail...");

        if (!file) {
            console.error("❌ API Upload: No file found in FormData");
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        console.log(`API Upload: File received - Name: ${file.name}, Size: ${file.size}, Type: ${file.type}`);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: 'batches',
                    resource_type: 'auto'
                },
                (error, result) => {
                    if (error) {
                        console.error("❌ Cloudinary Error:", error);
                        reject(error);
                    }
                    else {
                        console.log("✅ Cloudinary Success:", result?.secure_url);
                        resolve(result);
                    }
                }
            ).end(buffer);
        });

        return NextResponse.json({ url: result.secure_url });
    } catch (error) {
        console.error("❌ Upload Route Crash:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
