'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaMicrophoneSlash, FaStop, FaRobot, FaCheckCircle, FaExclamationCircle, FaVolumeUp, FaHome } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useSpeech } from '@/hooks/useSpeech'; // Assuming we can reuse/adapt this for TTS
import confetti from 'canvas-confetti';

interface VivaSessionProps {
    subject: string;
    chapter: string;
}

type SessionState = 'IDLE' | 'SPEAKING_QUESTION' | 'LISTENING' | 'PROCESSING' | 'FEEDBACK';

export default function VivaSession({ subject, chapter }: VivaSessionProps) {
    const router = useRouter();
    const [status, setStatus] = useState<SessionState>('IDLE');

    // Conversation State
    const [history, setHistory] = useState<{ role: string, content: string }[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState("Let's start your Viva. Are you ready?");
    const [feedback, setFeedback] = useState("");
    const [transcript, setTranscript] = useState("");

    // Audio State
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [isRecording, setIsRecording] = useState(false);

    // TTS
    // We'll use window.speechSynthesis directly for simplicity/control or the hook if versatile.
    // Let's use direct implementation for specific "English/Hindi" voice selection control.

    const speak = useCallback((text: string) => {
        if (typeof window === 'undefined') return;
        window.speechSynthesis.cancel(); // Stop previous

        const utterance = new SpeechSynthesisUtterance(text);

        // Try to find a good voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v =>
            v.name.includes('Google US English') ||
            v.name.includes('Microsoft Zira') ||
            v.name.includes('Natural')
        );

        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => setStatus('SPEAKING_QUESTION');
        utterance.onend = () => setStatus('IDLE');

        window.speechSynthesis.speak(utterance);
    }, []);

    // Initial Start
    useEffect(() => {
        // Start conversation on mount
        startRound("I am ready to start the viva.");
    }, []);

    const startRound = async (userResponse: string) => {
        setStatus('PROCESSING');

        // 1. Update History
        const newHistory = [...history, { role: 'user', content: userResponse }];
        setHistory(newHistory);

        try {
            // 2. Clear old transcript
            setTranscript("");

            // 3. Call AI API
            const res = await fetch('/api/ai/viva', {
                method: 'POST',
                body: JSON.stringify({
                    history: newHistory,
                    subject,
                    chapter
                })
            });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            // 4. Update State
            setFeedback(data.feedback);
            setCurrentQuestion(data.question);
            setHistory(prev => [
                ...prev,
                { role: 'assistant', content: JSON.stringify(data) } // Storing raw or processed? Better strict content.
                // Actually for Llama conversation context, better to store text. 
                // Let's store just the text content for future context.
            ]);

            // Adjust history storage to be cleaner for next round
            // We'll replace the last "assistant" entry with clean text
            setHistory([...newHistory, { role: 'assistant', content: `${data.feedback} ${data.question}` }]);

            // 5. Speak
            // Combine feedback + question for natural flow
            const textToSpeak = `${data.feedback}. ${data.question}`;
            speak(textToSpeak);

        } catch (err) {
            console.error(err);
            setCurrentQuestion("Sorry, I faced a glitch. Let's try again.");
            setStatus('IDLE');
        }
    };

    // --- Audio Logic ---

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                setStatus('PROCESSING');
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await handleAudioProcess(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setStatus('LISTENING');

        } catch (err) {
            console.error("Mic Error:", err);
            alert("Microphone access denied or not available.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            // Stream tracks should be stopped to release mic
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleAudioProcess = async (audioBlob: Blob) => {
        // 1. Transcribe (Groq)
        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.webm');

            const res = await fetch('/api/ai/transcribe', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (data.text) {
                setTranscript(data.text);
                // 2. Send to AI Logic
                await startRound(data.text);
            } else {
                throw new Error("No transcription text");
            }

        } catch (err) {
            console.error("Processing Error:", err);
            setTranscript("Error understanding audio. Please try again.");
            setStatus('IDLE');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-2xl mx-auto p-4">

            {/* Header / Context */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider mb-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" /> AI VIVA MODE
                </div>
                <h2 className="text-2xl font-bold text-gray-800">{subject}</h2>
                <p className="text-gray-500">{chapter}</p>
            </div>

            {/* AI Avatar / Visualizer */}
            <div className="relative mb-8">
                <motion.div
                    animate={{
                        scale: status === 'SPEAKING_QUESTION' ? [1, 1.05, 1] : 1,
                        boxShadow: status === 'SPEAKING_QUESTION'
                            ? "0 0 30px rgba(139, 92, 246, 0.5)"
                            : "0 0 0px rgba(0,0,0,0)"
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl border-4 border-white z-10 relative"
                >
                    <FaRobot className="text-5xl text-white" />
                </motion.div>

                {/* Visualizer Rings when Speaking */}
                {status === 'SPEAKING_QUESTION' && (
                    <>
                        <div className="absolute inset-0 rounded-full border-2 border-purple-400 animate-ping opacity-20" />
                        <div className="absolute -inset-4 rounded-full border border-purple-300 animate-ping opacity-10 animation-delay-500" />
                    </>
                )}
            </div>

            {/* Status Text */}
            <div className="h-40 w-full flex flex-col items-center justify-center text-center space-y-4">
                {status === 'SPEAKING_QUESTION' || status === 'IDLE' ? (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="question"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2"
                        >
                            {feedback && <p className="text-green-600 font-medium text-sm italic">"{feedback}"</p>}
                            <p className="text-xl md:text-2xl font-medium text-gray-800 leading-relaxed">
                                "{currentQuestion}"
                            </p>
                        </motion.div>
                    </AnimatePresence>
                ) : status === 'LISTENING' ? (
                    <motion.p
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-xl font-bold text-red-500 flex items-center gap-2"
                    >
                        <FaMicrophone /> Listening...
                    </motion.p>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                        <FaMicrophoneSlash className="text-2xl animate-spin" />
                        <p className="text-sm">Processing Answer...</p>
                    </div>
                )}
            </div>

            {/* Transcript Preview (What user said) */}
            {transcript && status !== 'LISTENING' && (
                <div className="mb-8 px-6 py-3 bg-gray-50 rounded-xl border border-gray-100 max-w-lg">
                    <p className="text-sm text-gray-500 text-center">
                        <span className="font-bold text-xs uppercase mr-2">You Said:</span>
                        {transcript}
                    </p>
                </div>
            )}

            {/* Controls */}
            <div className="fixed bottom-10 left-0 right-0 flex justify-center items-center gap-6 z-50">
                <button
                    onClick={() => router.push('/play')}
                    className="w-12 h-12 rounded-full bg-white shadow-lg text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors"
                >
                    <FaHome />
                </button>

                {/* Main Action Button */}
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={status === 'PROCESSING' || status === 'SPEAKING_QUESTION'}
                    className={`
                        w-20 h-20 rounded-full shadow-2xl flex items-center justify-center text-3xl transition-all transform hover:scale-105 active:scale-95
                        ${isRecording
                            ? 'bg-red-500 text-white animate-pulse shadow-red-500/50'
                            : status === 'PROCESSING' || status === 'SPEAKING_QUESTION'
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/50'
                        }
                    `}
                >
                    {isRecording ? <FaStop /> : <FaMicrophone />}
                </button>

                {status === 'SPEAKING_QUESTION' && (
                    <button
                        onClick={() => { window.speechSynthesis.cancel(); setStatus('IDLE'); }}
                        className="w-12 h-12 rounded-full bg-white shadow-lg text-gray-400 hover:text-gray-800 flex items-center justify-center"
                    >
                        <FaMicrophoneSlash />
                    </button>
                )}
            </div>
        </div>
    );
}
