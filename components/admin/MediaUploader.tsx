'use client';

import { useState, useRef } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { FaCloudUploadAlt, FaFilePdf, FaCheckCircle, FaSpinner } from 'react-icons/fa';

interface MediaUploaderProps {
    onUploadSuccess: (url: string, type: 'image' | 'video' | 'raw') => void;
    folder?: string;
}

export const MediaUploader = ({ onUploadSuccess, folder = 'padhaku_notes' }: MediaUploaderProps) => {
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [result, setResult] = useState<any | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadType, setUploadType] = useState<'image' | 'pdf'>('image');
    const pdfInputRef = useRef<HTMLInputElement>(null);

    // Direct PDF upload using our server API (bypasses Cloudinary preset issues)
    const handlePdfUpload = async (file: File) => {
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', folder);

            const response = await fetch('/api/upload-pdf', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok && data.url) {
                console.log("✅ PDF Upload Success:", data);
                setUploadedUrl(data.url);
                // Use the type returned from API (should be 'image' now for PDFs)
                const resType = data.type || 'raw';
                setResult({ info: { resource_type: resType, format: 'pdf', secure_url: data.url } });
                onUploadSuccess(data.url, resType);
            } else {
                console.error("❌ PDF Upload Failed:", data.error);
                alert("PDF upload failed: " + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error("❌ PDF Upload Error:", error);
            alert("PDF upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full">
            {/* Toggle between Image and PDF mode */}
            <div className="flex gap-2 mb-3 justify-center">
                <button
                    type="button"
                    onClick={() => setUploadType('image')}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${uploadType === 'image'
                        ? 'bg-pw-indigo text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    🖼️ Image
                </button>
                <button
                    type="button"
                    onClick={() => setUploadType('pdf')}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${uploadType === 'pdf'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    📄 PDF
                </button>
            </div>

            {uploadType === 'pdf' ? (
                // Direct PDF upload (server-side, guaranteed RAW type)
                <div
                    onClick={() => !uploading && pdfInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group ${uploading
                        ? 'border-gray-300 bg-gray-50'
                        : 'border-red-300 hover:bg-red-50'
                        }`}
                >
                    <input
                        ref={pdfInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePdfUpload(file);
                        }}
                    />

                    {uploading ? (
                        <>
                            <FaSpinner className="text-4xl text-red-400 animate-spin mb-3" />
                            <p className="text-sm font-bold text-gray-700">Uploading PDF...</p>
                        </>
                    ) : uploadedUrl && result?.info?.format === 'pdf' ? (
                        <div className="text-center w-full">
                            <FaCheckCircle className="text-4xl text-green-500 mb-2 mx-auto" />
                            <p className="text-sm text-gray-600 font-medium">PDF Uploaded! ✓</p>
                            <div className="mt-2 text-[10px] bg-green-50 p-2 rounded text-center">
                                <p><strong>Type:</strong> RAW (Correct!)</p>
                            </div>
                            <div className="flex gap-2 justify-center mt-3">
                                <a
                                    href={uploadedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600"
                                >
                                    Open PDF
                                </a>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setUploadedUrl(null); setResult(null); }}
                                    className="text-xs text-gray-400 hover:text-red-500 underline"
                                >
                                    Replace
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <FaFilePdf className="text-4xl text-red-400 group-hover:text-red-500 transition-colors mb-3" />
                            <p className="text-sm font-bold text-gray-700">Click to upload PDF</p>
                            <p className="text-xs text-gray-400 mt-1">Max 15MB • Will open correctly ✓</p>
                        </>
                    )}
                </div>
            ) : (
                // Image upload via Cloudinary widget
                <CldUploadWidget
                    uploadPreset="padhaku_uploads"
                    options={{
                        sources: ['local', 'url'],
                        folder: folder,
                        clientAllowedFormats: ['png', 'jpeg', 'jpg', 'webp', 'gif'],
                        maxFileSize: 10000000,
                        resourceType: 'image',
                    }}
                    onSuccess={(result: any) => {
                        console.log("Image Upload Success:", result);
                        if (result.info?.secure_url) {
                            setUploadedUrl(result.info.secure_url);
                            setResult(result);
                            onUploadSuccess(result.info.secure_url, 'image');
                        }
                    }}
                    onError={(error) => {
                        console.error("Image Upload Error:", error);
                    }}
                >
                    {({ open }) => (
                        <div
                            onClick={() => open()}
                            className="border-2 border-dashed border-pw-indigo/30 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-pw-indigo/5 transition-all group"
                        >
                            {uploadedUrl && result?.info?.resource_type === 'image' ? (
                                <div className="text-center w-full">
                                    <FaCheckCircle className="text-4xl text-green-500 mb-2 mx-auto" />
                                    <p className="text-sm text-gray-600 font-medium truncate max-w-[200px] mx-auto">Image Uploaded! ✓</p>
                                    <div className="flex gap-2 justify-center mt-3">
                                        <a
                                            href={uploadedUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="px-3 py-1 bg-pw-indigo text-white text-xs font-bold rounded hover:bg-pw-violet"
                                        >
                                            View Image
                                        </a>
                                        <button className="text-xs text-gray-400 hover:text-pw-indigo underline">
                                            Replace
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <FaCloudUploadAlt className="text-4xl text-pw-indigo/50 group-hover:text-pw-indigo transition-colors mb-3" />
                                    <p className="text-sm font-bold text-gray-700">Click to upload image</p>
                                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP supported</p>
                                </>
                            )}
                        </div>
                    )}
                </CldUploadWidget>
            )}

            <p className="text-[10px] text-gray-400 text-center mt-2">
                {uploadType === 'pdf' ? '📄 PDFs upload directly via server' : '🖼️ Images use Cloudinary widget'}
            </p>
        </div>
    );
};
