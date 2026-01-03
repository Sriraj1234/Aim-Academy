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
    // Modes: INITIAL -> CAMERA -> CROP -> SOLVING -> RESULT
    const [mode, setMode] = useState<'INITIAL' | 'CAMERA' | 'CROP' | 'SOLVING' | 'RESULT'>('INITIAL');
    const [solverType, setSolverType] = useState<'LENS' | 'AI'>('LENS');

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

    const startLensMode = () => {
        setSolverType('LENS');
        setMode('CAMERA');
    };

    const startAIMode = () => {
        setSolverType('AI');
        setMode('CAMERA');
    };

    const capture = useCallback(async () => {
        const image = webcamRef.current?.getScreenshot();
        if (image) {
            setImgSrc(image);

            if (solverType === 'LENS') {
                // --- FAST TRACK: LENS (No Crop) ---
                setMode('SOLVING');
                setError('');
                try {
                    // Convert Base64 to Blob
                    const blob = await (await fetch(image)).blob();

                    const formData = new FormData();
                    formData.append('file', blob, 'snap.jpg');

                    const res = await fetch('/api/upload', { method: 'POST', body: formData });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Upload Failed');

                    // Redirect
                    window.location.href = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(data.url)}`;

                } catch (e: any) {
                    console.error(e);
                    setError(e.message || 'Error redirecting to Lens');
                    setMode('CAMERA');
                }
            } else {
                // --- NORMAL TRACK: AI (With Crop) ---
                setMode('CROP');
            }
        }
    }, [webcamRef, solverType]);

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

            if (solverType === 'LENS') {
                // --- GOOGLE LENS FLOW ---
                const formData = new FormData();
                formData.append('file', croppedBlob, 'snap.jpg');

                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Upload Failed');

                // Redirect
                window.location.href = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(data.url)}`;
            }
            else {
                // --- INTERNAL AI FLOW ---
                const formData = new FormData();
                formData.append('image', croppedBlob, 'question.jpg');

                const res = await fetch('/api/ai/solve', { method: 'POST', body: formData });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to solve');

                setSolution(data.solution);
                setUsedModel(data.modelUsed);
                setMode('RESULT');
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error processing request');
            setMode('CROP');
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
            <div className="flex-1 flex flex-col items-center justify-center relative w-full max-w-2xl mx-auto p-4">

                {/* 1. INITIAL: Mode Selection */}
                {mode === 'INITIAL' && (
                    <div className="w-full flex flex-col justify-center gap-6 p-6 animate-in zoom-in-95 duration-300">
                        <div className="text-center mb-4">
                            <h2 className="text-3xl font-bold text-white mb-2">Choose Method</h2>
                            <p className="text-gray-400">How do you want to solve this?</p>
                        </div>

                        {/* Option 1: Google Lens */}
                        <button
                            onClick={startLensMode}
                            className="group relative w-full p-6 bg-gray-900 border border-gray-800 rounded-3xl flex items-center gap-4 hover:bg-gray-800 transition-all text-left"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center text-2xl shrink-0">
                                <FaGoogle />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white">Snap with Google Lens</h3>
                                <p className="text-gray-400 text-xs">Directly search images on Google.</p>
                            </div>
                            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                                <FaCamera className="text-xs" />
                            </div>
                        </button>

                        {/* Option 2: Internal AI */}
                        <button
                            onClick={startAIMode}
                            className="group relative w-full p-6 bg-indigo-900/40 border border-indigo-500/30 rounded-3xl flex items-center gap-4 hover:bg-indigo-900/60 transition-all text-left"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-lg shadow-indigo-500/30">
                                <FaRobot />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white">Solve with AI</h3>
                                <p className="text-indigo-200 text-xs">Step-by-step solution by Gemini.</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <FaBolt className="text-xs" />
                            </div>
                        </button>
                    </div>
                )}

                {/* 2. CAMERA: Internal AI Mode (Live Feed + Internal Upload) */}
                {mode === 'CAMERA' && (
                    <div className="relative w-full h-full flex flex-col items-center bg-black rounded-3xl overflow-hidden border border-gray-800">
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ facingMode: "environment" }}
                            className="w-full h-full object-cover"
                        />

                        {/* Internal Overlay Controls */}
                        <div className="absolute top-4 right-4 flex flex-col gap-3 z-20">
                            {/* Internal Upload Button */}
                            <label className="p-3 bg-black/50 text-white rounded-full backdrop-blur-md cursor-pointer hover:bg-black/70 transition-all border border-white/20" title="Upload Image">
                                <FaImage className="text-xl" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </label>
                        </div>

                        <div className="absolute bottom-0 inset-x-0 p-8 flex flex-col items-center bg-gradient-to-t from-black/90 to-transparent pt-20">
                            <p className="text-white/90 mb-6 text-sm font-bold tracking-wide flex items-center gap-2">
                                {solverType === 'LENS' ? <><FaGoogle /> Snap for Lens</> : <><FaRobot /> Snap for AI</>}
                            </p>
                            <button
                                onClick={capture}
                                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-110 transition-transform bg-white/20 backdrop-blur-sm shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                            >
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                                    <FaCamera className="text-gray-900 text-2xl" />
                                </div>
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
                                className={`w-full py-4 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${solverType === 'LENS' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                            >
                                {solverType === 'LENS' ? <><FaGoogle /> Search with Lens</> : <><FaBolt /> Solve with AI</>}
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
