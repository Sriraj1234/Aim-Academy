'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaMicrophoneSlash, FaStop, FaHome, FaClock } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

// 3D Avatar URL (Using DiceBear 'Avataaars' for a friendly female examiner look)
const TEACHER_AVATAR = "https://api.dicebear.com/9.x/avataaars/svg?seed=MsSia&clothing=blazerAndShirt&eyes=happy&mouth=smile&top=longHairStraight&hairColor=brown&skinColor=light";

type SessionState = 'IDLE' | 'SPEAKING_QUESTION' | 'LISTENING' | 'PROCESSING' | 'FEEDBACK' | 'FINISHED';

export default function VivaSession() {
    const router = useRouter();
    const [status, setStatus] = useState<SessionState>('IDLE');

    // Conversation State
    const [history, setHistory] = useState<{ role: string, content: string }[]>([]);

    // Initial Greeting (Hinglish - Ms. Sia)
    const [currentQuestion, setCurrentQuestion] = useState("Hello! Main Ms. Sia, aapki Viva Examiner hoon. Aaj aap kis subject aur topic ka viva dena chahenge?");

    const [feedback, setFeedback] = useState("");
    const [transcript, setTranscript] = useState("");

    // Audio & Auto-Submit State
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [isRecording, setIsRecording] = useState(false);

    // Silence Detection Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const lastTalkingTimeRef = useRef<number>(Date.now());

    // Timer State (7 Minutes = 420 seconds)
    const [timeLeft, setTimeLeft] = useState(420);

    // --- TIMER LOGIC ---
    useEffect(() => {
        if (timeLeft <= 0) {
            handleSessionEnd();
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSessionEnd = () => {
        setStatus('FINISHED');
        speak("Time is up! Thank you for the session. You did well.");
        confetti();
    };

    // --- TTS LOGIC ---
    const speak = useCallback((text: string) => {
        if (typeof window === 'undefined') return;
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Improved Voice Selection for "Ms. Sia" (Indian Female)
        const getPreferredVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            return voices.find(v =>
                (v.name.includes('Google हिन्दी') && v.lang.includes('hi')) || // Best natural Hinglish
                v.name.includes('Microsoft Heera') || // Very good Indian Female
                v.name.includes('Google English India') || // Good English
                (v.lang === 'hi-IN' && !v.name.includes('Male')) // Generic Female Hindi
            ) || voices.find(v => v.name.includes('Google US English'));
        };

        let preferredVoice = getPreferredVoice();

        // Retry if voices aren't loaded yet
        if (!preferredVoice && window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
                preferredVoice = getPreferredVoice();
                if (preferredVoice) utterance.voice = preferredVoice;
            };
        } else if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        // Tuned for "Teacher" Persona
        utterance.rate = 0.9;  // Slightly slower, more clear
        utterance.pitch = 1.05; // Slightly higher/feminine

        utterance.onstart = () => setStatus('SPEAKING_QUESTION');
        utterance.onend = () => {
            setStatus('IDLE');
        };

        window.speechSynthesis.speak(utterance);
    }, []);

    // Initial Start: Speak the Greeting automatically
    useEffect(() => {
        speak("Hello! Main Ms. Sia, aapki Viva Examiner hoon. Aaj aap kis subject aur topic ka viva dena chahenge?");
    }, [speak]);

    // --- MAIN API LOGIC ---
    const startRound = async (userResponse: string) => {
        setStatus('PROCESSING');
        const newHistory = [...history, { role: 'user', content: userResponse }];
        setHistory(newHistory);

        try {
            setTranscript("");
            const res = await fetch('/api/ai/viva', {
                method: 'POST',
                body: JSON.stringify({
                    history: newHistory,
                    subject: null,
                    chapter: null
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setFeedback(data.feedback);
            setCurrentQuestion(data.question);

            // Clean history for next context
            setHistory([...newHistory, { role: 'assistant', content: `${data.feedback} ${data.question}` }]);

            const textToSpeak = `${data.feedback}. ${data.question}`;
            speak(textToSpeak);

        } catch (err: any) {
            console.error(err);
            const msg = err.message || "Error connecting to AI";
            speak("Sorry, technical glitch. Let's try again.");
            setStatus('IDLE');
        }
    };

    // --- NATIVE SPEECH RECOGNITION LOGIC ---
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = false; // Auto-stop on silence
                recognition.interimResults = true;
                recognition.lang = 'en-IN'; // Works well for Hinglish usually

                recognitionRef.current = recognition;
            }
        }
    }, []);

    const startListening = () => {
        if (!recognitionRef.current) {
            alert("Speech Recognition not supported in this browser.");
            return;
        }

        setTranscript("");
        setIsRecording(true);
        setStatus('LISTENING');

        recognitionRef.current.onstart = () => {
            setIsRecording(true);
            setStatus('LISTENING');
        };

        recognitionRef.current.onresult = (event: any) => {
            const result = event.results[event.resultIndex];
            const text = result[0].transcript;
            setTranscript(text);

            if (result.isFinal) {
                stopRecording(); // Ensure it stops
                if (text.trim().length > 0) {
                    startRound(text); // Use the current startRound from closure
                } else {
                    setStatus('IDLE'); // No speech detected, go back to idle
                }
            }
        };

        recognitionRef.current.onerror = (e: any) => {
            console.error("Speech Recognition Error:", e);
            setIsRecording(false);
            if (e.error === 'no-speech') {
                speak("Didn't catch that. Please try again.");
            } else if (e.error === 'not-allowed') {
                alert("Microphone access denied. Please allow microphone access in your browser settings.");
            } else {
                speak("Sorry, an error occurred with speech recognition.");
            }
            setStatus('IDLE');
        };

        recognitionRef.current.onend = () => {
            setIsRecording(false);
            // If onresult's isFinal didn't trigger startRound, and we are not already processing, go to IDLE.
            // This handles cases where onend fires without a final result (e.g., very short utterance, or error).
            if (status !== 'PROCESSING') {
                setStatus('IDLE');
            }
        };

        try {
            recognitionRef.current.start();
        } catch (e: any) {
            // This catch handles cases where start() is called while already listening
            if (e.message.includes("already started")) {
                console.warn("Recognition already started, ignoring.");
            } else {
                console.error("Recognition start error:", e);
                setIsRecording(false);
                setStatus('IDLE');
            }
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current && isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
            // onend will handle status change
        }
    };

    // --- RENDER ---
    return (
        <div className="flex flex-col items-center justify-center min-h-[85vh] w-full max-w-2xl mx-auto p-4 relative">

            {/* TIMER BADGE */}
            <div className={`absolute top-0 right-4 flex items-center gap-2 px-4 py-2 rounded-full font-mono text-sm font-bold shadow-sm transition-colors ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white text-gray-600'}`}>
                <FaClock /> {formatTime(timeLeft)}
            </div>

            {/* Header */}
            <div className="text-center mb-6 mt-8">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> AI Examiner
                </div>
                {status === 'FINISHED' ? (
                    <h2 className="text-3xl font-bold text-gray-800">Session Complete!</h2>
                ) : (
                    <h2 className="text-2xl font-bold text-gray-800">Oral Exam (Viva)</h2>
                )}
            </div>

            {/* 3D AVATAR AREA */}
            <div className="relative mb-8">
                <motion.div
                    animate={{
                        scale: status === 'SPEAKING_QUESTION' ? [1, 1.05, 1] : 1,
                        filter: status === 'LISTENING' ? 'grayscale(0%)' : 'grayscale(0%)',
                    }}
                    transition={{ repeat: Infinity, duration: status === 'SPEAKING_QUESTION' ? 2 : 0 }}
                    className="w-40 h-40 rounded-full bg-white shadow-2xl border-4 border-white overflow-hidden relative z-10"
                >
                    <img
                        src={TEACHER_AVATAR}
                        alt="AI Teacher"
                        className="w-full h-full object-cover"
                    />
                </motion.div>

                {/* Status Rings */}
                {status === 'SPEAKING_QUESTION' && (
                    <>
                        <div className="absolute inset-0 rounded-full border-[3px] border-indigo-400 animate-ping opacity-30" />
                        <div className="absolute -inset-4 rounded-full border border-indigo-300 animate-ping opacity-20 animation-delay-500" />
                    </>
                )}
                {status === 'LISTENING' && (
                    <div className="absolute -inset-2 rounded-full border-2 border-red-400 animate-pulse opacity-50" />
                )}
            </div>

            {/* MAIN TEXT AREA */}
            <div className="min-h-[160px] w-full flex flex-col items-center justify-center text-center space-y-4 px-4 bg-white/50 rounded-3xl backdrop-blur-sm border border-white/40 p-6 shadow-sm">

                {status === 'FINISHED' ? (
                    <div className="space-y-4">
                        <p className="text-xl text-gray-700">Exam time is over.</p>
                        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Start New Viva</button>
                    </div>
                ) : status === 'SPEAKING_QUESTION' || status === 'IDLE' ? (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="question"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3"
                        >
                            {feedback && <p className={`font-medium text-sm italic ${feedback.toLowerCase().includes('incorrect') || feedback.toLowerCase().includes('galat') ? 'text-red-500' : 'text-green-600'}`}>"{feedback}"</p>}
                            <p className="text-xl md:text-2xl font-medium text-gray-800 leading-relaxed font-serif">
                                "{currentQuestion}"
                            </p>
                        </motion.div>
                    </AnimatePresence>
                ) : status === 'LISTENING' ? (
                    <motion.div
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="flex flex-col items-center gap-2"
                    >
                        <p className="text-red-500 font-bold tracking-widest text-sm uppercase">Listening...</p>
                        <div className="flex gap-1 h-8 items-end">
                            {[1, 2, 3, 4, 5].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{ height: [10, 30, 10] }}
                                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                                    className="w-1.5 bg-red-500 rounded-full"
                                />
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Will auto-submit on silence</p>
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center gap-3 text-indigo-500">
                        <FaMicrophoneSlash className="text-3xl animate-spin" />
                        <p className="text-sm font-bold animate-pulse">Analyzing Answer...</p>
                    </div>
                )}
            </div>

            {/* Transcript Preview */}
            {transcript && status !== 'LISTENING' && transcript.length > 5 && (
                <div className="mt-4 px-4 py-2 bg-gray-100/80 rounded-lg text-xs text-gray-500 border border-gray-200">
                    You: {transcript}
                </div>
            )}

            {/* Controls */}
            <div className="fixed bottom-8 left-0 right-0 flex justify-center items-center gap-8 z-50">
                <button
                    onClick={() => router.push('/play')}
                    className="w-14 h-14 rounded-full bg-white shadow-xl text-gray-400 hover:text-indigo-600 flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-gray-100"
                >
                    <FaHome className="text-xl" />
                </button>

                {/* Main Mic Button */}
                {status !== 'FINISHED' && (
                    <button
                        onClick={isRecording ? stopRecording : startListening}
                        disabled={status === 'PROCESSING' || status === 'SPEAKING_QUESTION'}
                        className={`
                            relative w-24 h-24 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] flex items-center justify-center text-4xl transition-all transform
                            ${isRecording
                                ? 'bg-red-500 text-white scale-110 ring-4 ring-red-200'
                                : status === 'PROCESSING' || status === 'SPEAKING_QUESTION'
                                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed scale-95'
                                    : 'bg-indigo-600 text-white hover:scale-105 active:scale-95 ring-4 ring-indigo-100'
                            }
                        `}
                    >
                        {isRecording ? <FaStop /> : <FaMicrophone />}
                    </button>
                )}
            </div>
        </div>
    );
}
