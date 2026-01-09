'use client';

import { useState, useEffect, useRef } from 'react';
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack, IRemoteAudioTrack } from 'agora-rtc-sdk-ng';
import { AGORA_APP_ID } from '@/lib/agoraConfig';
import { FaMicrophone, FaMicrophoneSlash, FaHeadphones, FaVolumeUp, FaLock } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { UpgradeModal } from '../subscription/UpgradeModal';

export const VoiceChatWidget = ({ channelName, playerId }: { channelName: string, playerId?: string }) => {
    const { user, userProfile } = useAuth();
    // Use passed playerId (game specific) or fallback to auth user id or random if generic
    const stableId = playerId || user?.uid || 'guest';

    // State
    const [volumeLevel, setVolumeLevel] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [micOn, setMicOn] = useState(false);
    const [speakerOn, setSpeakerOn] = useState(true);
    const [remoteUsersCount, setRemoteUsersCount] = useState(0);
    const [status, setStatus] = useState('Connecting...');
    const [error, setError] = useState<string | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const isPro = userProfile?.subscription?.plan === 'pro';

    // Refs
    const clientRef = useRef<IAgoraRTCClient | null>(null);
    const localTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
    const remoteTracksRef = useRef<Map<number, IRemoteAudioTrack>>(new Map());
    const speakerOnRef = useRef(true);

    // Sync ref
    useEffect(() => {
        speakerOnRef.current = speakerOn;
    }, [speakerOn]);

    // Volume Polling
    useEffect(() => {
        if (!micOn || !localTrackRef.current) {
            setVolumeLevel(0);
            return;
        }

        const interval = setInterval(() => {
            if (localTrackRef.current) {
                const level = localTrackRef.current.getVolumeLevel();
                setVolumeLevel(level * 100);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [micOn]);

    // Agora Logic
    useEffect(() => {
        if (!channelName) return;

        let isMounted = true;

        // Generate a DETERMINISTIC UID for this specific connection attempt
        // We REMOVE the random timestamp to prevent "phantom echo users" in React Strict Mode
        // If a previous connection exists, Agora will handle the collision (kick old or reject new)
        const base = stableId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15);
        const sessionUid = base; // Deterministic UID

        console.log('[Voice] Initializing new session with UID:', sessionUid);

        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        const init = async (retryCount = 0) => {
            try {
                // If retrying, append random suffix to avoid conflict
                const currentUid = retryCount > 0
                    ? `${sessionUid}_${Math.floor(Math.random() * 1000)}`
                    : sessionUid;

                setStatus(retryCount > 0 ? 'Retrying...' : 'Getting token...');
                const tokenUrl = `/api/agora?channelName=${channelName}&uid=${currentUid}`;

                const res = await fetch(tokenUrl);
                if (!res.ok) throw new Error(`Token Error: ${res.status}`);

                const data = await res.json();
                if (!data.token) throw new Error('No token received');

                setStatus('Joining...');

                // Join
                await client.join(AGORA_APP_ID, channelName, data.token, currentUid);

                if (!isMounted) return;
                setIsConnected(true);
                setStatus('Connected');

                // Enable Active Speaker Detection
                client.enableAudioVolumeIndicator();

                // Create Mic Track
                const micTrack = await AgoraRTC.createMicrophoneAudioTrack({
                    encoderConfig: "speech_standard",
                    AEC: true,
                    AGC: true,
                    ANS: true
                });

                localTrackRef.current = micTrack;

                // Start Muted (User preference)
                micTrack.setEnabled(false);
                setMicOn(false);

                await client.publish(micTrack);
                console.log('[Voice] Published (Muted)');

            } catch (err: any) {
                console.error('[Voice] Error:', err);

                // Handle UID Conflict (e.g. creating multiple tabs or strict mode race)
                if (err.code === 'UID_CONFLICT' && retryCount < 2) {
                    console.log('[Voice] UID Conflict, retrying with new UID...');
                    await init(retryCount + 1);
                    return;
                }

                if (isMounted) {
                    setError(err.message || 'Connection failed');
                    setStatus('Error');
                }
            }
        };

        // Handle remote user events
        client.on('user-published', async (remoteUser, mediaType) => {
            if (String(remoteUser.uid) === String(sessionUid)) return;

            if (mediaType === 'audio') {
                await client.subscribe(remoteUser, mediaType);
                const audioTrack = remoteUser.audioTrack;
                if (audioTrack) {
                    audioTrack.play();
                    // Sync volume with speaker state
                    audioTrack.setVolume(speakerOnRef.current ? 100 : 0);
                    remoteTracksRef.current.set(remoteUser.uid as any, audioTrack);
                }
                setRemoteUsersCount(remoteTracksRef.current.size);
            }
        });

        client.on('user-unpublished', (remoteUser, mediaType) => {
            if (mediaType === 'audio') {
                remoteTracksRef.current.delete(remoteUser.uid as any);
                setRemoteUsersCount(remoteTracksRef.current.size);
            }
        });

        client.on('user-left', (remoteUser) => {
            remoteTracksRef.current.delete(remoteUser.uid as any);
            setRemoteUsersCount(remoteTracksRef.current.size);
        });

        init();

        return () => {
            isMounted = false;
            // Separate async cleanup to avoid blocking the unmount
            const cleanup = async () => {
                if (localTrackRef.current) {
                    localTrackRef.current.close();
                    localTrackRef.current = null;
                }
                if (clientRef.current) {
                    await clientRef.current.leave();
                    clientRef.current = null;
                }
            };
            cleanup();
            setMicOn(false);
            setIsConnected(false);
        };
    }, [channelName]); // eslint-disable-line react-hooks/exhaustive-deps

    // Toggle mic
    const toggleMic = () => {
        if (!isPro) {
            setShowUpgradeModal(true);
            return;
        }

        if (localTrackRef.current) {
            const newState = !micOn;
            localTrackRef.current.setEnabled(newState);
            setMicOn(newState);
        }
    };

    // Toggle Speaker 
    const toggleSpeaker = () => {
        const newState = !speakerOn;
        setSpeakerOn(newState);
        remoteTracksRef.current.forEach(track => {
            track.setVolume(newState ? 100 : 0);
        });
    };

    if (!channelName) return null;

    if (error) {
        return (
            <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full border border-red-200 text-red-600 text-xs">
                <FaMicrophoneSlash size={12} />
                <span>Error: {error.slice(0, 10)}</span>
                <button onClick={() => window.location.reload()} className="underline font-bold">Retry</button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-xl px-3 py-1.5 rounded-full border border-gray-200/50 shadow-sm text-[11px]">
            {/* Connection Status & Volume Viz */}
            <div className="relative w-3 h-3 flex items-center justify-center">
                <div
                    className={`absolute inset-0 rounded-full opacity-50 transition-all duration-75 ${isConnected ? 'bg-green-500' : 'bg-orange-400'}`}
                    style={{ transform: `scale(${1 + Math.min(volumeLevel, 1)})` }}
                />
                <div
                    className={`w-2 h-2 rounded-full z-10 ${isConnected ? 'bg-green-500' : 'bg-orange-400 animate-pulse'}`}
                    title={status}
                />
            </div>

            <div className="h-4 w-[1px] bg-gray-200 mx-1"></div>

            {/* Mic Toggle */}
            <button
                onClick={toggleMic}
                disabled={!isConnected}
                className={`group relative p-2 rounded-full transition-all active:scale-90 flex items-center justify-center ${micOn
                    ? 'bg-pw-indigo text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    } ${!isConnected ? 'opacity-50' : ''}`}
                title={micOn ? 'Mute Mic' : 'Unmute Mic'}
            >
                {micOn ? <FaMicrophone size={12} /> : <FaMicrophoneSlash size={12} />}

                {/* Ping animation if talking */}
                {micOn && volumeLevel > 0.1 && (
                    <span className="absolute inset-0 rounded-full border border-white/50 animate-ping"></span>
                )}
                {!isPro && <span className="absolute -top-1 -right-1 bg-gray-900 text-yellow-400 text-[8px] p-0.5 rounded-full border border-white"><FaLock /></span>}
            </button>

            {/* Speaker Toggle */}
            <button
                onClick={toggleSpeaker}
                disabled={!isConnected}
                className={`p-2 rounded-full transition-all active:scale-90 flex items-center justify-center ${speakerOn
                    ? 'bg-white border border-pw-indigo text-pw-indigo shadow-sm'
                    : 'bg-gray-100 text-gray-400'
                    } ${!isConnected ? 'opacity-50' : ''}`}
                title={speakerOn ? 'Mute Speaker' : 'Unmute Speaker'}
            >
                {speakerOn ? <FaVolumeUp size={12} /> : <FaHeadphones size={12} />}
            </button>

            {/* Remote Users Count */}
            {(remoteUsersCount > 0) && (
                <div className="ml-1 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md transition-all">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-green-600 font-bold tabular-nums">{remoteUsersCount}</span>
                </div>
            )}

            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                featureName="Voice Chat"
            />
        </div>
    );
};
