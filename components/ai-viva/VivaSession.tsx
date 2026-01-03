'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaMicrophoneSlash, FaStop, FaHome, FaClock } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

// 3D Avatar (Female Teacher - Professional Look)
const TEACHER_AVATAR = "https://api.dicebear.com/9.x/avataaars/svg?seed=MsSia&clothing=blazerAndShirt&eyes=happy&mouth=smile&top=longHairStraight&hairColor=brown&skinColor=light&style=circle";

type SessionState = 'IDLE' | 'SPEAKING_QUESTION' | 'LISTENING' | 'PROCESSING' | 'FEEDBACK' | 'FINISHED';

export default function VivaSession() {
    const router = useRouter();
    const [status, setStatus] = useState<SessionState>('IDLE');

    // Conversation State
    const [history, setHistory] = useState<{ role: string, content: string }[]>([]);

    // Initial Greeting (AI Guru Persona)
    const [currentQuestion, setCurrentQuestion] = useState("Hello! Mis Sia here. Batao, aaj kya padhna hai? Ya koi doubt pareshaan kar raha hai?");

    const [feedback, setFeedback] = useState("");
    const [transcript, setTranscript] = useState("");
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);
    const hasGreetedRef = useRef(false);

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

    // --- TTS LOGIC (Google Cloud) ---
    const speak = useCallback(async (text: string) => {
        if (typeof window === 'undefined') return;

        // Stop previous audio immediately
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
        }

        try {
            setStatus('PROCESSING');
            // Phonetic tweak for "Mis" to sound like "Miss"
            const audioText = text.replace(/Mis Sia/g, "Miss Sia").replace(/\bMis\b/g, "Miss");

            const res = await fetch('/api/ai/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: audioText })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `TTS API Error: ${res.statusText}`);
            }

            const data = await res.json();

            if (data.audioContent) {
                const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
                currentAudioRef.current = audio;

                audio.onplay = () => setStatus('SPEAKING_QUESTION');

                // CRITICAL FAIL-SAFE: Handle Audio Load Errors (Event objects)
                audio.onerror = (e) => {
                    console.error("Audio Load Error (Event):", e);
                    setStatus('IDLE');
                };

                audio.onended = () => {
                    setStatus('IDLE');
                    currentAudioRef.current = null;
                };

                // Robust play handling
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        if (error.name === 'AbortError') {
                            // Ignore abort errors (intentional pauses)
                            console.log('Playback aborted intentionally');
                        } else {
                            console.error("Playback failed:", error);
                            setStatus('IDLE');
                        }
                    });
                }
            } else {
                console.error("No audio content received");
                // Fallback
                try {
                    const u = new SpeechSynthesisUtterance(text);
                    window.speechSynthesis.speak(u);
                } catch (e) {
                    console.error("Fallback TTS failed:", e);
                }
                setStatus('IDLE');
            }
        } catch (err: any) {
            // Handle [object Event] panic
            if (err && typeof err === 'object' && 'type' in err) {
                console.error("TTS Error (DOM Event):", err.type);
            } else {
                console.error("TTS Error:", err.message || err);
            }

            // Fallback attempt
            try {
                const u = new SpeechSynthesisUtterance(text);
                window.speechSynthesis.speak(u);
            } catch (fbErr) {
                console.error("Fallback TTS failed", fbErr);
            }
            setStatus('IDLE');
        }
    }, []);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current = null;
            }
        };
    }, []);

    // Initial Start: Speak the Greeting automatically
    useEffect(() => {
        if (hasGreetedRef.current) return;
        hasGreetedRef.current = true;
        speak("Hello! Mis Sia here. Batao, aaj kya padhna hai? Ya koi doubt pareshaan kar raha hai?");
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
            // Log specific error details (Object structure fix)
            console.error("Speech Recognition Error Event:", e.error, e.message);
            setIsRecording(false);

            if (e.error === 'aborted') {
                // Ignore intentional aborts (e.g. stopping manually)
                return;
            }

            if (e.error === 'no-speech') {
                speak("I didn't hear anything. Please try again.");
            } else if (e.error === 'not-allowed') {
                alert("Microphone access denied. Please allow microphone access in your browser settings.");
            } else if (e.error === 'network') {
                speak("Network error. Please check your internet.");
            } else {
                // Generic error fallback
                console.warn("Unhandled Speech Error:", e.error);
                speak("Sorry, I had trouble listening. Can you repeat?");
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
        <div className="flex flex-col items-center min-h-[90vh] w-full max-w-2xl mx-auto p-4 relative bg-gradient-to-br from-indigo-50/80 via-white/80 to-purple-50/80 rounded-[2.5rem] border border-white/60 shadow-2xl backdrop-blur-xl overflow-hidden mt-4 pb-40">

            {/* Background Orbs */}
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-200/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-200/30 rounded-full blur-3xl pointer-events-none animate-pulse animation-delay-1000" />

            {/* HEADER AREA */}
            <div className="w-full flex flex-col items-center justify-between z-10 mt-6 mb-4">

                {/* Top Row: Badge + Timer */}
                <div className="flex w-full justify-between items-center px-2 mb-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100/80 text-indigo-700 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border border-indigo-200">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> AI Guru
                    </div>

                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono text-sm font-bold shadow-sm transition-colors border ${timeLeft < 60 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-white/80 text-gray-600 border-gray-200'}`}>
                        <FaClock className="text-sm" /> {formatTime(timeLeft)}
                    </div>
                </div>

                {/* Title */}
                <div className="text-center">
                    {status === 'FINISHED' ? (
                        <h2 className="text-2xl font-bold text-gray-800">Session Complete!</h2>
                    ) : (
                        <h2 className="text-2xl font-bold text-gray-800">AI Mentor Session</h2>
                    )}
                </div>
            </div>

            {/* 3D AVATAR AREA */}
            <div className="relative mb-6 z-10">
                <motion.div
                    animate={{
                        scale: status === 'SPEAKING_QUESTION' ? [1, 1.05, 1] : 1,
                        filter: status === 'LISTENING' ? 'grayscale(0%)' : 'grayscale(0%)',
                    }}
                    transition={{ repeat: Infinity, duration: status === 'SPEAKING_QUESTION' ? 2 : 0 }}
                    className="w-40 h-40 rounded-full bg-white shadow-2xl border-4 border-white overflow-hidden relative z-10 ring-4 ring-indigo-50"
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
            <div className="w-full flex-1 flex flex-col items-center text-center space-y-4 px-4 z-10">
                <div className="w-full bg-white/60 rounded-3xl backdrop-blur-md border border-white/50 p-6 shadow-lg min-h-[140px] flex flex-col justify-center">
                    {status === 'FINISHED' ? (
                        <div className="space-y-4">
                            <p className="text-lg text-gray-700">Hope I could help! See you next time.</p>
                            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-transform hover:scale-105">Start New Session</button>
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
                                <p className="text-lg md:text-xl font-medium text-gray-800 leading-relaxed font-sans">
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
                            <p className="text-red-500 font-bold tracking-widest text-sm uppercase flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Listening...</p>
                            <div className="flex gap-1 h-8 items-end">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: [10, 24, 10] }}
                                        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                                        className="w-1.5 bg-gradient-to-t from-red-500 to-red-300 rounded-full"
                                    />
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 text-indigo-500">
                            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                            <p className="text-xs font-bold animate-pulse uppercase tracking-wider">Thinking...</p>
                        </div>
                    )}
                </div>

                {/* Transcript Preview */}
                {transcript && status !== 'LISTENING' && transcript.length > 5 && (
                    <div className="mt-2 w-full px-4 py-3 bg-indigo-50/80 rounded-xl text-xs text-indigo-800 border border-indigo-100 text-left shadow-sm">
                        <span className="font-bold">You:</span> {transcript}
                    </div>
                )}
            </div>

            {/* Controls Fixed Bottom */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6 z-50">
                <button
                    onClick={() => router.push('/play')}
                    className="w-12 h-12 rounded-full bg-white/90 backdrop-blur shadow-lg text-gray-400 hover:text-indigo-600 flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-white/50"
                >
                    <FaHome className="text-lg" />
                </button>

                {/* Main Mic Button */}
                {status !== 'FINISHED' && (
                    <button
                        onClick={isRecording ? stopRecording : startListening}
                        disabled={status === 'PROCESSING' || status === 'SPEAKING_QUESTION'}
                        className={`
                            relative w-20 h-20 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center text-3xl transition-all transform duration-300
                            ${isRecording
                                ? 'bg-gradient-to-tr from-red-500 to-pink-500 text-white scale-110 ring-4 ring-red-100 shadow-red-200'
                                : status === 'PROCESSING' || status === 'SPEAKING_QUESTION'
                                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed scale-95 ring-0'
                                    : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white hover:scale-105 active:scale-95 ring-4 ring-indigo-100 shadow-indigo-200'
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
