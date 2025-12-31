'use client';

import { useState, useCallback } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { FaCloudUploadAlt, FaFilePdf, FaImage, FaCheckCircle } from 'react-icons/fa';

interface MediaUploaderProps {
    onUploadSuccess: (url: string, type: 'image' | 'video' | 'raw') => void;
    folder?: string;
}

export const MediaUploader = ({ onUploadSuccess, folder = 'padhaku_notes' }: MediaUploaderProps) => {
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

    // Using CldUploadWidget for easy integration
    // Preset 'ml_default' or user needs to create an unsigned preset in Cloudinary dashboard if using unsigned upload
    // But for better security/easier usage with credentials we can use signed or default if configured.
    // Standard approach with next-cloudinary often uses upload presets.
    // We'll try to use a default or assume 'unsigned_upload' preset exists, 
    // OR we can rely on next-cloudinary's ability if configured.
    // Actually, simplest is to use CldUploadWidget with an unsigned preset.
    // User didn't give a preset. I'll prompt them if it fails, but often 'default' works or we create a standard upload wrapper.

    // Let's assume standard 'unsigned' preset or we might need to ask user to create one called 'padhaku_preset'.
    // However, `next-cloudinary` simplifies this.

    return (
        <div className="w-full">
            <CldUploadWidget
                uploadPreset="padhaku_uploads" // We will ask user to create this, or use 'ml_default'
                options={{
                    sources: ['local', 'url'],
                    folder: folder,
                    clientAllowedFormats: ['png', 'jpeg', 'jpg', 'pdf', 'webp'],
                    maxFileSize: 10000000, // 10MB
                }}
                onSuccess={(result: any) => {
                    console.log("Upload Success:", result);
                    if (result.info?.secure_url) {
                        setUploadedUrl(result.info.secure_url);
                        onUploadSuccess(result.info.secure_url, result.info.resource_type);
                    }
                }}
                onError={(error) => {
                    console.error("Upload Error:", error);
                    // If preset fails, we might show a message
                }}
            >
                {({ open }) => {
                    return (
                        <div
                            onClick={() => open()}
                            className="border-2 border-dashed border-pw-indigo/30 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-pw-indigo/5 transition-all group"
                        >
                            {uploadedUrl ? (
                                <div className="text-center">
                                    <FaCheckCircle className="text-4xl text-green-500 mb-2 mx-auto" />
                                    <p className="text-sm text-gray-600 font-medium break-all">{uploadedUrl}</p>
                                    <p className="text-xs text-pw-indigo mt-2">Click to replace</p>
                                </div>
                            ) : (
                                <>
                                    <FaCloudUploadAlt className="text-4xl text-pw-indigo/50 group-hover:text-pw-indigo transition-colors mb-3" />
                                    <p className="text-sm font-bold text-gray-700">Click to upload file</p>
                                    <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG supported</p>
                                </>
                            )}
                        </div>
                    );
                }}
            </CldUploadWidget>

            {/* Fallback note if preset missing */}
            <p className="text-[10px] text-gray-400 text-center mt-2">
                *Requires Cloudinary Upload Preset 'padhaku_uploads'
            </p>
        </div>
    );
};
