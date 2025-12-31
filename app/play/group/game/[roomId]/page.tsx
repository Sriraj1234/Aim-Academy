'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { submitAnswer, nextQuestion, endGame } from '@/utils/roomService';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaCheckCircle, FaClock, FaShapes, FaBolt, FaStar, FaUsers, FaTimes, FaChevronDown } from 'react-icons/fa';
import { VoiceChatWidget } from '@/components/group/VoiceChatWidget';

export default function GamePage() {
    const { roomId } = useParams();
    const router = useRouter();
    const [room, setRoom] = useState<any>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showMobilePlayers, setShowMobilePlayers] = useState(false);

    // Calculate generic time left for display
    const [timeLeftDisplay, setTimeLeftDisplay] = useState(30);

    const isHost = typeof window !== 'undefined' && localStorage.getItem(`room_host_${roomId}`) === 'true';

    useEffect(() => {
        if (!roomId) return;
        const storedName = localStorage.getItem(`player_name_${roomId}`);
        const storedId = localStorage.getItem(`player_id_${roomId}`);
        console.log("Game Debug: storedName/Id", storedName, storedId);

        const unsub = onSnapshot(doc(db, 'rooms', roomId as string), (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                setRoom(data);

                // Check Expiration (Lazy Deletion) in realtime listener as a fail-safe
                if (data.expiresAt && Date.now() > data.expiresAt) {
                    alert("This room has expired.");
                    router.push('/play/group');
                }

                if (data.players) {
                    let myEntry: any = null;

                    // 1. Try matching by User ID (Strongest check)
                    if (storedId) {
                        myEntry = Object.values(data.players).find((p: any) => p.userId === storedId);
                    }

                    // 2. Fallback: Try matching by Name (Legacy/Anonymous)
                    if (!myEntry && storedName) {
                        myEntry = Object.values(data.players).find((p: any) => p.name === storedName);
                    }

                    if (myEntry) {
                        setPlayerId(myEntry.id);
                    } else {
                        console.warn("Game Debug: Player Identity Verification Failed", { storedName, storedId });
                    }
                }

                if (data.status === 'finished') {
                    router.push(`/play/group/result/${roomId}`);
                }
            } else {
                console.error("Game Debug: Room does not exist");
                // Potentially redirect if room deleted
            }
        });
        return () => unsub();
    }, [roomId, router]);

    useEffect(() => {
        if (room) {
            setSelectedOption(null);
            setIsSubmitted(false);

            if (playerId && room.players[playerId]?.answers[room.currentQuestionIndex] !== undefined) {
                setSelectedOption(room.players[playerId].answers[room.currentQuestionIndex]);
                setIsSubmitted(true);
            }
        }
    }, [room?.currentQuestionIndex, playerId]);

    const totalQuestions = room?.questions?.length || 0;
    const playersList = room ? Object.values(room.players) as any[] : [];
    const answeredCount = room ? playersList.filter(p => p.answers[room.currentQuestionIndex] !== undefined).length : 0;

    // Define handleNext before it is used in useEffect
    const handleNext = async () => {
        if (!room) return;
        if (room.currentQuestionIndex + 1 >= totalQuestions) {
            await endGame(roomId as string);
        } else {
            await nextQuestion(roomId as string, room.currentQuestionIndex);
        }
    };

    const handleAnswer = async (index: number) => {
        if (!room || isSubmitted || !currentQ || !playerId) return;
        setSelectedOption(index);
        setIsSubmitted(true);

        const isCorrect = index === currentQ.correctAnswer;
        await submitAnswer(roomId as string, playerId, room.currentQuestionIndex, index, isCorrect);
    };

    // --- Automation Logic (Run by Host Only) ---
    useEffect(() => {
        if (!isHost || !room || room.status !== 'in-progress') return;

        // 1. Check if Everyone Answered
        if (answeredCount === playersList.length && totalQuestions > 0) {
            // Add small delay for visual confirmation before skipping
            const timer = setTimeout(() => {
                handleNext();
            }, 1000);
            return () => clearTimeout(timer);
        }

        // 2. Timer Check is handled by the Synced Timer component or separate interval
        // We'll calculate time based on server stamp
        const checkTime = setInterval(() => {
            if (room.questionStartTime) {
                const elapsed = Date.now() - room.questionStartTime;
                const timeLeft = 30000 - elapsed; // 30 seconds
                if (timeLeft <= 0) {
                    handleNext();
                }
            }
        }, 1000);

        return () => clearInterval(checkTime);
    }, [room, answeredCount, isHost, totalQuestions, playersList.length]);

    useEffect(() => {
        if (!room?.questionStartTime) return;
        const interval = setInterval(() => {
            const elapsed = Date.now() - room.questionStartTime;
            const remaining = Math.max(0, Math.ceil((30000 - elapsed) / 1000));
            setTimeLeftDisplay(remaining);
        }, 500);
        return () => clearInterval(interval);
    }, [room?.questionStartTime]);

    if (!room) return (
        <div className="min-h-screen bg-surface-off flex flex-col items-center justify-center text-brand-600">
            <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
            <h2 className="text-xl font-bold font-display">Loading Game...</h2>
        </div>
    );

    if (!playerId) {
        return (
            <div className="min-h-screen bg-surface-off flex flex-col items-center justify-center text-text-main p-6 text-center">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <FaBolt className="text-red-500 text-4xl" />
                </div>
                <h2 className="text-2xl font-bold font-display mb-2">Connection Issue</h2>
                <p className="mb-8 text-text-sub max-w-md">We found the room, but couldn't verify your player identity. Let's try rejoining.</p>
                <button
                    onClick={() => router.push(`/play/group/lobby/${roomId}`)}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-brand-500/30 transition-all hover:-translate-y-1"
                >
                    Back to Lobby
                </button>
            </div>
        );
    }

    const currentQ = room.questions[room.currentQuestionIndex];
    if (!currentQ && room.currentQuestionIndex >= room.questions.length) {
        return <div className="min-h-screen bg-brand-600 flex items-center justify-center text-white text-3xl font-bold">Game Over!</div>;
    }

    return (
        <div className="min-h-screen bg-surface-off overflow-hidden relative font-sans">
            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] animate-pulse-slow" />
                <div className="absolute top-1/2 -right-20 w-80 h-80 bg-accent-500/10 rounded-full blur-[80px] animate-pulse-slow delay-700" />
                <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-green-400/10 rounded-full blur-[60px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6 min-h-screen flex flex-col">

                {/* Sidebar: Players - Hidden on mobile, visible on md+ */}
                <aside className="hidden md:flex w-72 flex-col h-full justify-center fixed left-4 top-1/2 -translate-y-1/2">
                    <div className="bg-white/60 backdrop-blur-md border border-white/50 rounded-[2rem] p-5 shadow-soft max-h-[200px] md:max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="font-bold text-text-sub uppercase text-xs tracking-wider flex items-center gap-2">
                                <FaUser /> Players ({playersList.length})
                            </h3>
                            <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-full">
                                {answeredCount}/{playersList.length} Done
                            </span>
                        </div>

                        <div className="space-y-3">
                            {playersList.map((p) => {
                                const hasAnswered = p.answers[room.currentQuestionIndex] !== undefined;
                                const isMe = p.id === playerId;
                                return (
                                    <motion.div
                                        layout
                                        key={p.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`relative p-3 rounded-2xl border-2 transition-all flex items-center gap-3 ${isMe ? 'bg-brand-50 border-brand-200' : 'bg-white border-transparent hover:border-gray-100'
                                            } ${hasAnswered ? 'ring-2 ring-green-400 ring-offset-2' : ''}`}
                                    >
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shadow-sm">
                                                {p.photoURL ? (
                                                    <img src={p.photoURL} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <FaUser />
                                                    </div>
                                                )}
                                            </div>
                                            {hasAnswered && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute -bottom-1 -right-1 bg-green-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 border-white"
                                                >
                                                    <FaCheckCircle />
                                                </motion.div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-bold truncate ${isMe ? 'text-brand-700' : 'text-text-main'}`}>
                                                {p.name} {isMe && '(You)'}
                                            </p>
                                            <p className="text-xs text-text-sub flex items-center gap-1">
                                                <FaStar className="text-yellow-400" /> {p.score || 0} pts
                                            </p>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                </aside>

                {/* Main Game Board */}
                <main className="flex-1 flex flex-col">

                    {/* Timer Progress Bar (Mobile & Desktop) */}
                    <div className="w-full bg-gray-200 h-2 rounded-full mb-4 overflow-hidden relative">
                        <motion.div
                            initial={{ width: '100%' }}
                            animate={{ width: `${(timeLeftDisplay / 30) * 100}%` }}
                            transition={{ ease: "linear", duration: 0.5 }}
                            className={`h-full ${timeLeftDisplay <= 10 ? 'bg-red-500' : 'bg-brand-500'}`}
                        />
                    </div>

                    {/* Mobile Player Strip (Stories Style) - Always Visible */}
                    <div className="md:hidden flex gap-3 overflow-x-auto pb-4 mb-2 custom-scrollbar no-scrollbar">
                        {playersList.map((p) => {
                            const hasAnswered = p.answers[room.currentQuestionIndex] !== undefined;
                            const isMe = p.id === playerId;
                            return (
                                <div key={p.id} className="flex flex-col items-center gap-1 min-w-[3.5rem]">
                                    <div className={`
                                        w-12 h-12 rounded-full p-0.5 border-2 relative
                                        ${hasAnswered ? 'border-green-500' : 'border-gray-200'}
                                    `}>
                                        <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 relative">
                                            {p.photoURL ? (
                                                <img src={p.photoURL} alt={p.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">{(p.name?.[0] || 'U')}</div>
                                            )}
                                            {/* Status Badge */}
                                            {hasAnswered && (
                                                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                                    <FaCheckCircle className="text-white drop-shadow-md text-lg md:text-xl" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-medium text-gray-600 truncate w-14 text-center">
                                        {isMe ? 'You' : p.name.split(' ')[0]}
                                    </span>
                                </div>
                            )
                        })}
                    </div>

                    {/* Floating Header */}
                    <div className="flex justify-between items-center mb-2 md:mb-6">
                        {/* Question Counter & Voice Chat */}
                        <div className="flex items-center gap-2">
                            <VoiceChatWidget channelName={roomId as string} />

                            <div className="bg-white/80 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-sm text-xs md:text-sm font-bold text-text-sub border border-white/50">
                                Q <span className="text-brand-600 text-sm md:text-lg">{room.currentQuestionIndex + 1}</span>
                                <span className="text-gray-400 mx-1">/</span>
                                {totalQuestions}
                            </div>
                        </div>

                        <div className={`
                            flex items-center gap-1.5 px-3 py-1.5 md:px-5 md:py-2 rounded-full shadow-lg border-2 md:border-4 transition-all duration-500
                            ${timeLeftDisplay <= 10 ? 'bg-red-50 border-red-100 text-red-600 animate-pulse' : 'bg-white border-brand-100 text-brand-600'}
                        `}>
                            <FaClock size={12} className={timeLeftDisplay <= 10 ? 'animate-bounce' : ''} />
                            <span className="font-mono font-black text-base md:text-xl w-10 md:w-14 text-center">
                                {timeLeftDisplay}s
                            </span>
                        </div>
                    </div>

                    {/* Question Card Area */}
                    <div className="flex-1 flex flex-col justify-center relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={room.currentQuestionIndex}
                                initial={{ opacity: 0, x: 50, rotate: 2 }}
                                animate={{ opacity: 1, x: 0, rotate: 0 }}
                                exit={{ opacity: 0, x: -50, rotate: -2 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                className="w-full max-w-3xl mx-auto"
                            >
                                {/* Question Text */}
                                <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 shadow-card border border-white/50 mb-4 md:mb-8 relative">
                                    <h2 className="text-lg md:text-2xl font-display font-bold text-text-main leading-snug">
                                        {currentQ.question}
                                    </h2>
                                </div>

                                {/* Options Grid */}
                                <div className="grid grid-cols-1 gap-2 md:gap-4 relative">
                                    {/* Waiting Overlay - Covers options when submitted */}
                                    {isSubmitted && (
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 rounded-2xl flex flex-col items-center justify-center text-brand-700 animate-in fade-in duration-300">
                                            <div className="bg-white p-4 rounded-2xl shadow-xl border border-brand-100 flex flex-col items-center">
                                                <div className="flex gap-1 mb-2">
                                                    <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                                <p className="font-bold text-sm">Waiting for others...</p>
                                                <p className="text-xs text-brand-400 mt-1">{answeredCount}/{playersList.length} Answered</p>
                                            </div>
                                        </div>
                                    )}

                                    {currentQ.options.map((opt: string, idx: number) => {
                                        const isSelected = selectedOption === idx;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleAnswer(idx)}
                                                disabled={isSubmitted}
                                                className={`
                                                    relative p-3 md:p-5 rounded-xl md:rounded-2xl text-left border-b-2 md:border-b-4 transition-all duration-200
                                                    ${isSelected
                                                        ? 'bg-brand-600 border-brand-800 text-white shadow-lg z-10'
                                                        : `bg-white border-gray-200 text-text-main shadow-sm ${isSubmitted ? 'opacity-40' : 'active:scale-[0.98]'}`}
                                                `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`
                                                        w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-lg flex-shrink-0
                                                        ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}
                                                    `}>
                                                        {String.fromCharCode(65 + idx)}
                                                    </div>
                                                    <span className="font-semibold text-sm md:text-base">{opt}</span>
                                                    {isSelected && (
                                                        <FaCheckCircle className="ml-auto text-white text-lg" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </main>
            </div>
        </div>
    );
}
