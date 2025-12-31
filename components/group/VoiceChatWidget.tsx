'use client';

import { useState, useEffect, useRef } from 'react';
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack, IRemoteAudioTrack } from 'agora-rtc-sdk-ng';
import { AGORA_APP_ID } from '@/lib/agoraConfig';
import { FaMicrophone, FaMicrophoneSlash, FaHeadphones, FaVolumeUp } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

// Helper to convert String UID to numeric (Agora compatible)
function stringToNumber(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash) % 65000;
}

export const VoiceChatWidget = ({ channelName }: { channelName: string }) => {
    const { user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [micOn, setMicOn] = useState(false);
    const [remoteUsersCount, setRemoteUsersCount] = useState(0);
    const [status, setStatus] = useState('Connecting...');
    const [error, setError] = useState<string | null>(null);

    const clientRef = useRef<IAgoraRTCClient | null>(null);
    const localTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
    const remoteTracksRef = useRef<Map<number, IRemoteAudioTrack>>(new Map());

    const numericUid = user?.uid ? stringToNumber(user.uid) : 0;

    useEffect(() => {
        if (!channelName || !numericUid) return;

        let isMounted = true;
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        const init = async () => {
            try {
                setStatus('Getting token...');

                // Fetch token from our API
                const res = await fetch(`/api/agora?channelName=${channelName}&uid=${numericUid}`);
                if (!res.ok) throw new Error('Token fetch failed');
                const data = await res.json();
                if (!data.token) throw new Error('No token received');

                setStatus('Joining channel...');

                // Join the channel
                await client.join(AGORA_APP_ID, channelName, data.token, numericUid);

                if (!isMounted) return;
                setIsConnected(true);
                setStatus('Connected');

                // Create and publish local mic track
                const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
                localTrackRef.current = micTrack;
                micTrack.setEnabled(false); // Start muted
                await client.publish(micTrack);
                console.log('[Voice] Local mic published');

            } catch (err: any) {
                console.error('[Voice] Init Error:', err);
                if (isMounted) {
                    setError(err.message || 'Connection failed');
                    setStatus('Error');
                }
            }
        };

        // Handle remote user events
        client.on('user-published', async (remoteUser, mediaType) => {
            console.log('[Voice] User published:', remoteUser.uid, mediaType);
            if (mediaType === 'audio') {
                await client.subscribe(remoteUser, mediaType);
                const audioTrack = remoteUser.audioTrack;
                if (audioTrack) {
                    audioTrack.play();
                    audioTrack.setVolume(100);
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
            if (localTrackRef.current) {
                localTrackRef.current.close();
            }
            remoteTracksRef.current.forEach(track => track.stop());
            remoteTracksRef.current.clear();
            client.leave().catch(console.error);
        };
    }, [channelName, numericUid]);

    // Toggle mic
    const toggleMic = () => {
        if (localTrackRef.current) {
            const newState = !micOn;
            localTrackRef.current.setEnabled(newState);
            setMicOn(newState);
            console.log('[Voice] Mic:', newState ? 'ON' : 'OFF');
        }
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
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-xl px-2 py-1 rounded-full border border-gray-200/50 shadow-sm text-[11px]">
            {/* Connection Status - Tiny dot */}
            <div
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isConnected ? 'bg-green-500' : 'bg-orange-400 animate-pulse'}`}
                title={status}
            />

            {/* Mic Toggle - Compact */}
            <button
                onClick={toggleMic}
                disabled={!isConnected}
                className={`p-1.5 rounded-full transition-all active:scale-90 ${micOn
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-500'
                    } ${!isConnected ? 'opacity-50' : ''}`}
                title={micOn ? 'Mute' : 'Unmute'}
            >
                {micOn ? <FaMicrophone size={10} /> : <FaMicrophoneSlash size={10} />}
            </button>

            {/* Remote Users - Minimal */}
            <span className="text-gray-500 font-medium tabular-nums">{remoteUsersCount}</span>

            {/* Audio indicator */}
            {remoteUsersCount > 0 && (
                <FaVolumeUp size={10} className="text-green-500 animate-pulse" />
            )}
        </div>
    );
};
