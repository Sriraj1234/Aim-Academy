'use client';

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import Cropper from 'react-easy-crop';
import { FaCamera, FaImage, FaTimes, FaBolt, FaRobot, FaCheckCircle, FaSpinner, FaCrop, FaUndo, FaRedo, FaGoogle, FaArrowRight } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useAuth } from '@/context/AuthContext';
import { TrialReminderModal } from '@/components/subscription/TrialReminderModal';

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
    const { checkAccess, incrementUsage } = useAuth();
    // Modes: INITIAL -> CAMERA -> CROP -> SOLVING -> RESULT
    const [mode, setMode] = useState<'INITIAL' | 'CAMERA' | 'CROP' | 'SOLVING' | 'RESULT'>('INITIAL');
    const [solverType, setSolverType] = useState<'LENS' | 'AI'>('LENS');
    const [showPaywall, setShowPaywall] = useState(false);

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

        // Check Limit for AI Solver
        if (solverType === 'AI') {
            const allowed = checkAccess('snap_solve');
            if (!allowed) {
                setShowPaywall(true);
                return;
            }
        }

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

                // Increment Usage Only if Request Succeeds
                if (solverType === 'AI') {
                    await incrementUsage('snap_solve');
                }
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
        <div className="relative h-full bg-black text-white flex flex-col overflow-hidden">
            <TrialReminderModal
                isOpen={showPaywall}
                onClose={() => setShowPaywall(false)}
                message="You've reached your daily limit for AI Solutions."
                subMessage="Upgrade to Pro for more AI power!"
            />

            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <div onClick={reset} className="flex items-center gap-2 cursor-pointer pointer-events-auto">
                    <div className="bg-blue-600 p-1.5 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                        <FaBolt className="text-white text-sm" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">Snap & Solve</span>
                </div>
                {mode !== 'INITIAL' && (
                    <button onClick={reset} className="pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
                        <FaTimes className="text-lg" />
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
            <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full">

                {/* 1. INITIAL: Mode Selection */}
                {mode === 'INITIAL' && (
                    <div className="w-full h-full flex flex-col justify-center items-center gap-6 p-6 animate-in zoom-in-95 duration-300 relative">

                        {/* Background Effects */}
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[100px]" />
                            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[100px]" />
                        </div>

                        <div className="text-center mb-8 relative z-10">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)] mb-6 transform rotate-3">
                                <FaCamera className="text-4xl text-white" />
                            </div>
                            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-3">Snap & Solve</h2>
                            <p className="text-gray-400 font-medium">Get instant homework help</p>
                        </div>

                        <div className="w-full max-w-md space-y-4 relative z-10">
                            {/* Option 1: Google Lens */}
                            <button
                                onClick={startLensMode}
                                className="group relative w-full p-5 bg-gradient-to-r from-gray-900 to-gray-800 border border-white/10 rounded-2xl flex items-center gap-4 hover:border-blue-500/50 transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
                            >
                                <div className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center text-2xl shrink-0 shadow-lg">
                                    <FaGoogle />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Google Lens</h3>
                                    <p className="text-gray-500 text-xs font-medium">Fast • Search Web • Objects</p>
                                </div>
                                <FaArrowRight className="text-white/20 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                            </button>

                            {/* Option 2: Internal AI */}
                            <button
                                onClick={startAIMode}
                                className="group relative w-full p-5 bg-gradient-to-r from-indigo-900/40 to-indigo-900/20 border border-indigo-500/30 rounded-2xl flex items-center gap-4 hover:bg-indigo-900/40 transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-lg shadow-indigo-500/30">
                                    <FaRobot />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">AI Solution</h3>
                                    <p className="text-indigo-200/60 text-xs font-medium">Detailed • Step-by-Step • Math</p>
                                </div>
                                <FaArrowRight className="text-indigo-500/50 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>
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
                                onCropChange={(location) => setCrop(location)}
                                onCropComplete={onCropComplete}
                                onZoomChange={(zoom) => setZoom(zoom)}
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
