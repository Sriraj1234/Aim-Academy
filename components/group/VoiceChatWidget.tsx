'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack, IRemoteAudioTrack } from 'agora-rtc-sdk-ng';
import { AGORA_APP_ID } from '@/lib/agoraConfig';
import { FaMicrophone, FaMicrophoneSlash, FaHeadphones, FaVolumeUp } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

// Helper to convert String UID to numeric (Agora compatible)
// Helper to remove special characters for Agora UID compliance if needed
// But generic string works fine as long as we use user account mode
// We will just use a clean string

export const VoiceChatWidget = ({ channelName, playerId }: { channelName: string, playerId?: string }) => {
    const { user } = useAuth();
    // Use passed playerId (game specific) or fallback to auth user id or random if generic
    const stableId = playerId || user?.uid || 'guest';

    const [isConnected, setIsConnected] = useState(false);
    const [micOn, setMicOn] = useState(false);
    const [remoteUsersCount, setRemoteUsersCount] = useState(0);
    const [status, setStatus] = useState('Connecting...');
    const [error, setError] = useState<string | null>(null);

    const clientRef = useRef<IAgoraRTCClient | null>(null);
    const localTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
    const remoteTracksRef = useRef<Map<number, IRemoteAudioTrack>>(new Map());

    const [speakerOn, setSpeakerOn] = useState(true);
    const speakerOnRef = useRef(true);

    useEffect(() => {
        speakerOnRef.current = speakerOn;
    }, [speakerOn]);

    useEffect(() => {
        if (!channelName) return;

        let isMounted = true;

        // Generate a FRESH UID for this specific connection attempt
        // This ensures that even if the component re-renders or quick-refreshes,
        // we never reuse an ID that might be stuck on the server.
        const base = stableId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
        const sessionUid = `${base}_${Date.now().toString().slice(-6)}`;

        console.log('[Voice] Initializing new session with UID:', sessionUid);

        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        const init = async () => {
            try {
                setStatus('Getting token...');
                const tokenUrl = `/api/agora?channelName=${channelName}&uid=${sessionUid}`;
                console.log('[Voice] Fetching token from:', tokenUrl);

                const res = await fetch(tokenUrl);
                if (!res.ok) {
                    const errorText = await res.text();
                    console.error('[Voice] Token fetch failed:', res.status, errorText);
                    throw new Error(`Token Error: ${res.status}`);
                }

                const data = await res.json();
                console.log('[Voice] Token received:', data.token ? 'YES' : 'NO');

                if (!data.token) throw new Error('No token received from server');

                setStatus('Joining channel...');

                // Helper to join with retry
                const joinWithRetry = async (retries = 1, delay = 1500) => {
                    try {
                        console.log(`[Voice] Joining Agora Channel: ${channelName} with UID: ${sessionUid}`);
                        // Important: Pass sessionUid here
                        await client.join(AGORA_APP_ID, channelName, data.token, sessionUid);
                        console.log('[Voice] Join Success!');
                    } catch (err: any) {
                        console.error('[Voice] Join Failed:', err);
                        if ((err.code === "UID_CONFLICT" || err.message?.includes("UID_CONFLICT")) && retries > 0) {
                            console.warn(`[Voice] UID Conflict detected. Retrying in ${delay}ms...`);
                            setStatus('Retrying connection...');
                            await new Promise(resolve => setTimeout(resolve, delay));
                            await joinWithRetry(retries - 1, delay);
                        } else {
                            throw err;
                        }
                    }
                };

                await joinWithRetry();

                if (!isMounted) return;
                setIsConnected(true);
                setStatus('Connected');

                // Enable Active Speaker Detection (helps with switching on some devices)
                client.enableAudioVolumeIndicator();

                // Create and publish local mic track with OPTIMIZED config for Mobile
                const micTrack = await AgoraRTC.createMicrophoneAudioTrack({
                    encoderConfig: "speech_standard",
                    AEC: true, // Echo Cancellation
                    ANS: true  // Noise Suppression
                });

                localTrackRef.current = micTrack;
                micTrack.setEnabled(false); // Start muted
                await client.publish(micTrack);
                console.log('[Voice] Local mic published (Speech Mode)');

            } catch (err: any) {
                console.error('[Voice] Init Critical Error:', err);
                if (isMounted) {
                    if (err.code === "UID_CONFLICT" || err.message?.includes("UID_CONFLICT")) {
                        setError('Device conflict. Please refresh.');
                    } else {
                        setError(err.message || 'Connection failed');
                    }
                    setStatus('Error');
                }
            }
        };

        // Handle remote user events
        client.on('user-published', async (remoteUser, mediaType) => {
            console.log('[Voice] User published:', remoteUser.uid, mediaType);

            // Safety: Do not subscribe to self (should handled by Agora, but verifying)
            // Use sessionUid from closure
            if (remoteUser.uid === sessionUid) {
                console.warn('[Voice] Ignoring self-published stream');
                return;
            }

            if (mediaType === 'audio') {
                await client.subscribe(remoteUser, mediaType);
                const audioTrack = remoteUser.audioTrack;
                if (audioTrack) {
                    audioTrack.play();
                    // Use ref to set initial volume based on current state
                    audioTrack.setVolume(speakerOnRef.current ? 100 : 0);
                    remoteTracksRef.current.set(remoteUser.uid as number, audioTrack);
                    console.log('[Voice] Playing audio from:', remoteUser.uid);
                }
                setRemoteUsersCount(remoteTracksRef.current.size);
            }
        });

        client.on('user-unpublished', (remoteUser, mediaType) => {
            console.log('[Voice] User unpublished:', remoteUser.uid);
            if (mediaType === 'audio') {
                remoteTracksRef.current.delete(remoteUser.uid as number);
                setRemoteUsersCount(remoteTracksRef.current.size);
            }
        });

        client.on('user-left', (remoteUser) => {
            console.log('[Voice] User left:', remoteUser.uid);
            remoteTracksRef.current.delete(remoteUser.uid as number);
            setRemoteUsersCount(remoteTracksRef.current.size);
        });

        init();

        // Cleanup
        return () => {
            isMounted = false;
            // Separate async cleanup to avoid blocking
            const cleanup = async () => {
                try {
                    if (localTrackRef.current) {
                        localTrackRef.current.close();
                        localTrackRef.current = null;
                        setMicOn(false);
                    }
                    remoteTracksRef.current.forEach(track => track.stop());
                    remoteTracksRef.current.clear();
                    if (clientRef.current) {
                        await clientRef.current.leave();
                        clientRef.current = null;
                    }
                    setIsConnected(false);
                } catch (e) {
                    console.error('Cleanup error:', e);
                }
            };
            cleanup();
        };
    }, [channelName]); // REMOVED speakerOn dependency to prevent re-join loops

    // Toggle mic
    const toggleMic = () => {
        if (localTrackRef.current) {
            const newState = !micOn;
            localTrackRef.current.setEnabled(newState);
            setMicOn(newState);
            console.log('[Voice] Mic:', newState ? 'ON' : 'OFF');
        }
    };

    // Toggle Speaker (Mute/Unmute incoming audio)
    const toggleSpeaker = () => {
        const newState = !speakerOn;
        setSpeakerOn(newState);

        // Update all existing remote tracks
        remoteTracksRef.current.forEach(track => {
            track.setVolume(newState ? 100 : 0);
        });
        console.log('[Voice] Speaker:', newState ? 'ON' : 'OFF');
    };

    if (!channelName) return null;

    if (error) {
        return (
            <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full border border-red-200 text-red-600 text-xs">
                <FaMicrophoneSlash size={12} />
                <span>{error.slice(0, 15)}...</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-xl px-3 py-1.5 rounded-full border border-gray-200/50 shadow-sm text-[11px]">
            {/* Connection Status - Tiny dot */}
            <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${isConnected ? 'bg-green-500' : 'bg-orange-400 animate-pulse'}`}
                title={status}
            />

            <div className="h-4 w-[1px] bg-gray-200 mx-1"></div>

            {/* Mic Toggle */}
            <button
                onClick={toggleMic}
                disabled={!isConnected}
                className={`p-2 rounded-full transition-all active:scale-90 flex items-center justify-center ${micOn
                    ? 'bg-pw-indigo text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    } ${!isConnected ? 'opacity-50' : ''}`}
                title={micOn ? 'Mute Mic' : 'Unmute Mic'}
            >
                {micOn ? <FaMicrophone size={12} /> : <FaMicrophoneSlash size={12} />}
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
                <div className="ml-1 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md">
                    <span className="text-green-600 font-bold tabular-nums">{remoteUsersCount}</span>
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                </div>
            )}
        </div>
    );
};
