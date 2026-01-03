'use client';

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import Cropper from 'react-easy-crop';
import { FaCamera, FaImage, FaTimes, FaBolt, FaRobot, FaCheckCircle, FaSpinner, FaCrop, FaUndo, FaRedo, FaGoogle } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// --- Utility: Create Cropped Image ---
const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Canvas is empty'));
                return;
            }
            resolve(blob);
        }, 'image/jpeg');
    });
}
// -------------------------------------

export default function SnapSolver() {
    const [mode, setMode] = useState<'INITIAL' | 'CAMERA' | 'CROP' | 'SOLVING' | 'RESULT'>('INITIAL');

    // Camera State
    const webcamRef = useRef<Webcam>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);

    // Crop State
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    // Solution State
    const [solution, setSolution] = useState('');
    const [usedModel, setUsedModel] = useState('');
    const [error, setError] = useState('');

    // --- Actions ---

    const startCamera = () => setMode('CAMERA');

    const capture = useCallback(() => {
        const image = webcamRef.current?.getScreenshot();
        if (image) {
            setImgSrc(image);
            setMode('CROP');
        }
    }, [webcamRef]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImgSrc(reader.result?.toString() || '');
                setMode('CROP');
            });
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const processSolution = async () => {
        if (!imgSrc || !croppedAreaPixels) return;

        setMode('SOLVING');
        setError('');

        try {
            const croppedBlob = await getCroppedImg(imgSrc, croppedAreaPixels);

            const formData = new FormData();
            formData.append('image', croppedBlob, 'question.jpg');

            const res = await fetch('/api/ai/solve', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');

            setSolution(data.solution);
            setUsedModel(data.modelUsed);
            setMode('RESULT');

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error solving problem');
            setMode('CROP'); // Go back to crop on error
        }
    };

    const reset = () => {
        setImgSrc(null);
        setSolution('');
        setMode('INITIAL');
    };

    return (
        <div className="relative min-h-screen bg-black text-white flex flex-col">

            {/* Top Bar */}
            <div className="p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
                <div onClick={reset} className="flex items-center gap-2 cursor-pointer">
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                        <FaBolt className="text-white text-sm" />
                    </div>
                    <span className="font-bold text-lg">Snap & Solve</span>
                </div>
                {mode !== 'INITIAL' && (
                    <button onClick={reset} className="text-white/80 hover:text-white">
                        <FaTimes className="text-xl" />
                    </button>
                )}
            </div>

            {/* ERROR MESSAGE */}
            {error && (
                <div className="absolute top-20 left-4 right-4 z-50 bg-red-500/90 text-white p-3 rounded-xl text-center backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-top-4">
                    {error}
                </div>
            )}

            {/* --- CORE CONTENT AREA --- */}
            <div className="flex-1 flex flex-col items-center justify-center relative w-full max-w-2xl mx-auto">

                {/* 1. INITIAL: Buttons */}
                {mode === 'INITIAL' && (
                    <div className="flex flex-col items-center gap-6 p-8 animate-in zoom-in-95 duration-300">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-4">
                            <FaRobot className="text-5xl text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-center">Solve Doubts Instantly</h2>
                        <p className="text-gray-400 text-center max-w-xs">Take a photo of any math or science problem to get a step-by-step solution.</p>

                        <div className="flex flex-col gap-4 w-full max-w-xs mt-4">
                            <button
                                onClick={startCamera}
                                className="w-full py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-105 transition-transform"
                            >
                                <FaCamera /> Open Camera
                            </button>
                            <label className="w-full py-4 bg-gray-800 text-white rounded-2xl font-bold flex items-center justify-center gap-3 cursor-pointer hover:bg-gray-700 transition-colors">
                                <FaImage /> Upload from Gallery
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </label>

                            <a
                                href="https://lens.google.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 w-full py-3 border border-gray-700 text-gray-400 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 hover:text-white transition-colors"
                            >
                                <FaGoogle /> Use Google Lens
                            </a>
                        </div>
                    </div>
                )}

                {/* 2. CAMERA: Live Feed */}
                {mode === 'CAMERA' && (
                    <div className="relative w-full h-full flex flex-col items-center bg-black">
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ facingMode: "environment" }}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-10 inset-x-0 flex justify-center">
                            <button
                                onClick={capture}
                                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-110 transition-transform bg-white/20 backdrop-blur-sm"
                            >
                                <div className="w-16 h-16 bg-white rounded-full" />
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. CROP: Adjust Image */}
                {mode === 'CROP' && imgSrc && (
                    <div className="absolute inset-0 bg-black flex flex-col">
                        <div className="flex-1 relative">
                            <Cropper
                                image={imgSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={undefined} // Free crop
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>
                        <div className="bg-gray-900 p-6 flex flex-col gap-4">
                            <p className="text-center text-sm text-gray-400">Crop to the specific question</p>
                            <div className="flex justify-between items-center px-4">
                                <span className="text-xs">Zoom</span>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full mx-4"
                                />
                            </div>
                            <button
                                onClick={processSolution}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors"
                            >
                                <FaCheckCircle /> Solve This Question
                            </button>
                        </div>
                    </div>
                )}

                {/* 4. SOLVING: Loading */}
                {mode === 'SOLVING' && (
                    <div className="flex flex-col items-center justify-center p-8 text-center animate-pulse">
                        <div className="relative w-32 h-32 mb-8">
                            <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full" />
                            <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin" />
                            <FaBolt className="absolute inset-0 m-auto text-4xl text-blue-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Analyzing Problem...</h3>
                        <p className="text-gray-400">Using {usedModel || 'Gemini 3'}...</p>
                    </div>
                )}

                {/* 5. RESULT: Show Answer */}
                {mode === 'RESULT' && (
                    <div className="w-full h-full bg-gray-50 text-gray-900 flex flex-col relative overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-6 pb-24 scrollbar-hide">
                            <div className="max-w-prose mx-auto prose prose-lg prose-blue">
                                <ReactMarkdown
                                    remarkPlugins={[remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                >
                                    {solution}
                                </ReactMarkdown>
                            </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3 shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
                            <button
                                onClick={() => setMode('CAMERA')}
                                className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-200 flex items-center justify-center gap-2"
                            >
                                <FaCamera /> Another
                            </button>
                            <button className="flex-1 py-3 bg-blue-600 rounded-xl font-bold text-white hover:bg-blue-700 flex items-center justify-center gap-2">
                                <FaRobot /> Explain More
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
