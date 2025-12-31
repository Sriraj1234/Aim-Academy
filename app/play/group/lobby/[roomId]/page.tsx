'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { joinRoom, startGame, leaveRoom } from '@/utils/roomService';
import { FaCopy, FaCrown, FaPlay, FaCheckCircle, FaClock, FaGamepad, FaUser, FaSpinner, FaArrowLeft, FaUserPlus, FaMicrophone, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { FriendsDrawer } from '@/components/home/FriendsDrawer';
import { useFriends } from '@/hooks/useFriends';
import { VoiceChatWidget } from '@/components/group/VoiceChatWidget';

export default function LobbyPage() {
    const { roomId } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [room, setRoom] = useState<any>(null);
    const [isJoining, setIsJoining] = useState(false);
    const [hasJoined, setHasJoined] = useState(false);
    const [error, setError] = useState('');
    const [isNavigating, setIsNavigating] = useState(false);
    const [showFriends, setShowFriends] = useState(false);
    const { sendGameInvite } = useFriends();
    const [inviteLoading, setInviteLoading] = useState(false);

    const handleInviteFriend = async (friendUid: string) => {
        setInviteLoading(true);
        try {
            await sendGameInvite(friendUid, roomId as string);
            // Optionally show success toast
        } catch (e) {
            console.error(e);
        } finally {
            setInviteLoading(false);
        }
    };

    useEffect(() => {
        if (!roomId) return;

        const storedName = localStorage.getItem(`player_name_${roomId}`);
        if (storedName) setHasJoined(true);

        const unsub = onSnapshot(doc(db, 'rooms', roomId as string), (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                setRoom(data);

                if (user && data.players) {
                    const amIIn = Object.values(data.players).some((p: any) => p.userId === user.uid);
                    if (amIIn) setHasJoined(true);
                }

                if (data.status === 'in-progress' && hasJoined && !isNavigating) {
                    setIsNavigating(true);
                    router.push(`/play/group/game/${roomId}`);
                }
            } else {
                setError("Room deleted or invalid.");
            }
        });

        return () => unsub();
    }, [roomId, router, isNavigating, hasJoined, user]);

    const handleJoin = async () => {
        if (!user) return;
        setIsJoining(true);
        try {
            const userName = user.displayName || 'Player';
            await joinRoom(roomId as string, userName, user.uid, user.photoURL || undefined);
            localStorage.setItem(`player_name_${roomId}`, userName);
            localStorage.setItem(`player_id_${roomId}`, user.uid);
            setHasJoined(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsJoining(false);
        }
    };

    const handleStart = async () => {
        try {
            await startGame(roomId as string);
        } catch (e) {
            alert("Error starting game");
        }
    };

    const handleLeave = async () => {
        if (!user) return;
        try {
            const playerId = localStorage.getItem(`player_id_${roomId}`) || user.uid;
            await leaveRoom(roomId as string, playerId);
            localStorage.removeItem(`player_name_${roomId}`);
            localStorage.removeItem(`player_id_${roomId}`);
            localStorage.removeItem(`room_host_${roomId}`); // Just in case, though host should probably delete room
            setHasJoined(false);
            router.push('/play/group');
        } catch (e) {
            console.error("Failed to leave room", e);
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(roomId as string);
        // Could use a toast here
    };

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-pw-surface p-4">
            <div className="bg-white p-8 rounded-[2rem] shadow-pw-lg text-center max-w-md border border-red-100">
                <div className="w-20 h-20 mx-auto bg-red-50 rounded-full flex items-center justify-center text-3xl mb-4 text-red-500">😢</div>
                <h2 className="text-2xl font-bold text-red-500 mb-2">Room Error</h2>
                <p className="text-gray-600 mb-6 font-medium">{error}</p>
                <button onClick={() => router.push('/play/group')} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors">Go Back</button>
            </div>
        </div>
    );

    if (!room) return (
        <div className="min-h-screen bg-pw-surface flex flex-col items-center justify-center">
            <FaSpinner className="text-4xl text-pw-indigo animate-spin mb-4" />
            <p className="text-pw-violet font-bold uppercase tracking-widest text-sm animate-pulse">Connecting to Lobby...</p>
        </div>
    );

    const isHost = localStorage.getItem(`room_host_${roomId}`) === 'true';
    const playersList = Object.values(room.players || {});

    // Render "Join" screen if not joined
    if (!hasJoined) {
        return (
            <div className="min-h-screen bg-pw-surface flex items-center justify-center p-6 relative overflow-hidden font-sans">
                {/* Background Decor */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-pw-indigo/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-pw-violet/5 rounded-full blur-[120px]" />
                </div>

                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 md:p-12 rounded-[2.5rem] max-w-lg w-full text-center shadow-pw-xl border border-pw-border relative z-10">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-pw-indigo/10 text-pw-indigo text-xs font-bold uppercase tracking-widest mb-6 border border-pw-indigo/20">Ranked Match</span>

                    <h1 className="text-4xl font-display font-bold text-pw-violet mb-2">Join Squad</h1>
                    <p className="text-gray-500 mb-8 font-medium">You have been invited to play!</p>

                    {/* Ticket Style Code */}
                    <div className="relative bg-pw-surface border-2 border-dashed border-pw-border rounded-2xl p-6 mb-8 overflow-hidden group hover:border-pw-indigo/50 transition-colors">
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-r-2 border-pw-border"></div>
                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-l-2 border-pw-border"></div>

                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Room Code</p>
                        <p className="text-5xl font-mono text-pw-violet font-bold tracking-[0.2em]">{roomId}</p>
                    </div>

                    {user ? (
                        <div className="flex items-center gap-4 bg-pw-surface p-4 rounded-xl mb-8 text-left border border-pw-border">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Me" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                            ) : (
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-lg font-bold text-pw-indigo shadow-sm border border-pw-border">
                                    {(user.displayName || 'U')[0]}
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-pw-indigo font-bold uppercase">Joining As</p>
                                <p className="font-bold text-gray-900 line-clamp-1">{user.displayName}</p>
                            </div>
                            <div className="ml-auto">
                                <FaCheckCircle className="text-green-500 text-xl" />
                            </div>
                        </div>
                    ) : (
                        <div className="mb-8 p-6 bg-red-50 rounded-2xl border border-red-100">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500 mx-auto mb-3">
                                <FaUser />
                            </div>
                            <p className="text-red-800 font-bold mb-1">Login Required</p>
                            <p className="text-red-500 text-sm mb-4">You must be logged in to join this ranked match.</p>
                            <button onClick={() => router.push('/login')} className="bg-red-500 hover:bg-red-600 text-white w-full py-3 rounded-xl font-bold transition-colors shadow-lg shadow-red-500/30">Login / Signup</button>
                        </div>
                    )}

                    <button
                        onClick={handleJoin}
                        disabled={isJoining || !user}
                        className="w-full bg-gradient-to-r from-pw-indigo to-pw-violet hover:shadow-pw-lg disabled:opacity-50 text-white py-5 rounded-2xl font-bold text-lg shadow-pw-md transition-all flex items-center justify-center gap-3 hover:-translate-y-1 active:scale-[0.98]"
                    >
                        {isJoining ? <FaSpinner className="animate-spin" /> : 'Enter Lobby'}
                    </button>
                </motion.div>
            </div>
        );
    }

    // Render Lobby
    return (
        <div className="min-h-screen bg-pw-surface p-4 md:p-8 flex flex-col relative overflow-hidden font-sans">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-pw-indigo/5 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto w-full relative z-10 flex-1 flex flex-col">
                {/* Header Bar */}
                <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-white/80 backdrop-blur-xl p-4 rounded-[2rem] border border-pw-border shadow-pw-sm">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button
                            onClick={handleLeave}
                            className="w-12 h-12 bg-white hover:bg-red-50 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors shadow-sm border border-pw-border"
                            title="Leave Room"
                        >
                            <FaSignOutAlt className={isHost ? "rotate-180" : ""} />
                        </button>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Subject</p>
                            <h2 className="text-xl font-bold text-pw-violet capitalize flex items-center gap-2">
                                {room.subject}
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                <span className="text-gray-500 font-medium text-base">{room.chapter}</span>
                            </h2>
                        </div>
                    </div>

                    {/* Room Code Badge */}
                    <div onClick={copyCode} className="cursor-pointer group relative">
                        <div className="absolute inset-0 bg-pw-indigo rounded-xl blur opacity-10 group-hover:opacity-20 transition-opacity"></div>
                        <div className="relative bg-white border border-pw-border group-hover:border-pw-indigo/30 px-6 py-2 rounded-xl flex items-center gap-3 transition-colors">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Room Code</p>
                                <p className="font-mono text-2xl font-bold text-pw-indigo tracking-wider leading-none">{roomId}</p>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-pw-surface flex items-center justify-center text-pw-indigo group-hover:scale-110 transition-transform">
                                <FaCopy size={12} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-pw-border shadow-sm">
                            <div className="flex -space-x-2">
                                {playersList.slice(0, 3).map((p: any) => (
                                    <div key={p.id} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden">
                                        {p.photoURL ? <img src={p.photoURL} referrerPolicy="no-referrer" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">{p.name[0]}</div>}
                                    </div>
                                ))}
                            </div>
                            <span className="font-bold text-gray-700 ml-1">{playersList.length} <span className="text-gray-400 font-normal text-sm">Joined</span></span>
                        </div>

                        {/* Voice Chat */}
                        <VoiceChatWidget channelName={roomId as string} />

                        <button
                            onClick={() => setShowFriends(true)}
                            className="bg-pw-indigo/10 hover:bg-pw-indigo/20 text-pw-indigo w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                            title="Invite Friends"
                        >
                            <FaUserPlus />
                        </button>
                    </div>
                </header>

                {/* Players Grid - Stadium View */}
                <div className="flex-1 bg-white/60 rounded-[3rem] p-8 border border-white shadow-sm mb-8 backdrop-blur-md overflow-hidden relative">
                    <p className="text-center text-gray-400 font-bold uppercase tracking-widest text-xs mb-8 bg-white/50 inline-block px-4 py-1 rounded-full border border-white mx-auto">Lobby Area</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        <AnimatePresence>
                            {playersList.map((p: any) => (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className="relative group perspective"
                                >
                                    <div className="bg-white p-6 rounded-[2rem] shadow-pw-md hover:shadow-pw-lg border border-pw-border hover:border-pw-indigo/30 transition-all flex flex-col items-center text-center relative z-10 h-full justify-between group-hover:-translate-y-1">
                                        {p.id === room.hostId && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm flex items-center gap-1">
                                                <FaCrown size={10} /> Host
                                            </div>
                                        )}

                                        <div className="relative mb-4">
                                            {p.photoURL ? (
                                                <img src={p.photoURL} className="w-20 h-20 rounded-2xl object-cover shadow-md group-hover:rotate-3 transition-transform duration-300 ring-4 ring-white" alt={p.name} referrerPolicy="no-referrer" />
                                            ) : (
                                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pw-indigo to-pw-violet flex items-center justify-center text-3xl font-bold text-white shadow-md group-hover:rotate-3 transition-transform duration-300 ring-4 ring-white">
                                                    {(p.name || 'P')[0]}
                                                </div>
                                            )}
                                            <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center text-white text-[10px] shadow-sm">
                                                <FaCheckCircle />
                                            </div>
                                        </div>

                                        <div className="w-full">
                                            <h3 className="font-bold text-gray-800 truncate w-full mb-1">{p.name}</h3>
                                            <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider bg-green-50 border border-green-100 px-2 py-1 rounded-lg inline-block">Ready to Play</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Empty Slots */}
                        {Array.from({ length: Math.max(0, 5 - playersList.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="border-2 border-dashed border-gray-200 hover:border-pw-indigo/20 rounded-[2rem] flex flex-col items-center justify-center opacity-40 hover:opacity-80 transition-all min-h-[180px] bg-white/30 hover:bg-white/60">
                                <div className="w-12 h-12 rounded-full bg-gray-100 mb-3 flex items-center justify-center text-gray-300">
                                    <FaUser size={20} />
                                </div>
                                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Open Slot</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Action */}
                <div className="flex justify-center pb-8">
                    {isHost ? (
                        <div className="bg-white p-2 rounded-[2.5rem] shadow-pw-xl border border-pw-border flex items-center gap-4 animate-in slide-in-from-bottom duration-500 ring-4 ring-pw-surface">
                            {/* If room not configured yet */}
                            {!room.subject ? (
                                <button
                                    onClick={() => router.push(`/play/group/host?existingRoomId=${roomId}`)}
                                    className="bg-pw-indigo hover:bg-pw-violet text-white px-12 py-4 rounded-[2rem] text-xl font-bold shadow-lg hover:shadow-pw-indigo/25 transition-all flex items-center gap-3 active:scale-95"
                                >
                                    <FaGamepad /> CONFIGURE GAME
                                </button>
                            ) : (
                                <>
                                    <div className="pl-8 pr-4 text-left">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Lobby Status</p>
                                        <p className="text-xl font-bold text-pw-violet">{playersList.length} <span className="text-gray-400 text-sm font-medium">Players Ready</span></p>
                                    </div>
                                    <button
                                        onClick={handleStart}
                                        className="bg-gradient-to-r from-pw-indigo to-pw-violet hover:shadow-pw-lg text-white px-12 py-4 rounded-[2rem] text-xl font-bold shadow-pw-md transition-all flex items-center gap-3 active:scale-95 hover:-translate-y-0.5"
                                    >
                                        <FaPlay /> START MATCH
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white px-10 py-5 rounded-[2rem] shadow-pw-xl border border-pw-border flex items-center gap-6 ring-4 ring-pw-surface">
                            <div className="relative">
                                <div className="absolute inset-0 bg-pw-indigo rounded-full blur animate-pulse opacity-20"></div>
                                <div className="relative bg-pw-indigo/10 text-pw-indigo p-4 rounded-full">
                                    <FaClock size={20} />
                                </div>
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                <h3 className="text-xl font-bold text-pw-violet">
                                    {!room.subject ? 'Host is choosing topic...' : 'Waiting for Host to start...'}
                                </h3>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <FriendsDrawer
                isOpen={showFriends}
                onClose={() => setShowFriends(false)}
                onInvite={handleInviteFriend}
                inviteLoading={inviteLoading}
            />
        </div >
    );
}
