'use client';

import { useState, useEffect } from 'react';
import {
    AgoraRTCProvider,
    useJoin,
    useLocalMicrophoneTrack,
    usePublish,
    useRemoteUsers,
    useRemoteAudioTracks,
    useRTCClient
} from "agora-rtc-react";
import AgoraRTC, { IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import { AGORA_APP_ID, AGORA_TOKEN } from '@/lib/agoraConfig';
import { FaMicrophone, FaMicrophoneSlash, FaHeadphones } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

// Helper component to play remote audio
// Helper component to play remote audio manually (More robust than the hook's auto-play)
const RemoteAudioTracks = ({ users }: { users: any[] }) => {
    const { audioTracks } = useRemoteAudioTracks(users);

    useEffect(() => {
        // Manually play each track and log it
        audioTracks.forEach((track) => {
            if (track) {
                try {
                    if (!track.isPlaying) {
                        track.play();
                        console.log("Boosting audio for user", track.getUserId());
                    }
                    // Increase volume to max
                    track.setVolume(100);
                } catch (e) {
                    console.error("Audio Play Error:", e);
                }
            }
        });

        return () => {
            // Optional: stop on unmount, but often better to let Agora handle cleanup
            // audioTracks.forEach(track => track.stop());
        };
    }, [audioTracks]);

    return null;
};

// This component handles the actual connection logic
const VoiceChatInner = ({ channelName }: { channelName: string }) => {
    const { user } = useAuth();
    const client = useRTCClient();

    // 1. Join with Token
    const [token, setToken] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState('');
    const [debugStatus, setDebugStatus] = useState('Initializing...');

    // Generate Numeric UID from User ID (Persistent)
    const numericUid = user?.uid ? stringToNumber(user.uid) : 0;

    useEffect(() => {
        const fetchToken = async () => {
            if (!channelName || !numericUid) return;
            setDebugStatus('Fetching token...');
            try {
                // Fetch from our own API using the Numeric UID
                const res = await fetch(`/api/agora?channelName=${channelName}&uid=${numericUid}`);

                if (!res.ok) {
                    const text = await res.text();
                    console.error("Token API Error:", text);
                    setFetchError(`Server Error: ${res.status}`);
                    setDebugStatus('Token error');
                    return;
                }

                const data = await res.json();
                if (data.token) {
                    setToken(data.token);
                    setDebugStatus('Token received');
                } else {
                    setFetchError(data.error || 'Failed to get token');
                    setDebugStatus('Token missing');
                }
            } catch (e) {
                console.error(e);
                setFetchError('Network error fetching token');
                setDebugStatus('Network error');
            }
        };
        if (numericUid) fetchToken();
    }, [channelName, numericUid]);

    const { isConnected, isLoading, error: joinError } = useJoin(
        {
            appid: AGORA_APP_ID,
            channel: channelName,
            token: token,
            uid: numericUid
        },
        !!token && !!numericUid // Only join when both token and UID are ready
    );

    const error = joinError || (fetchError ? new Error(fetchError) : null);

    // 2. Microphone Handling
    const { localMicrophoneTrack } = useLocalMicrophoneTrack(true);
    const [micOn, setMicOn] = useState(false);

    // 3. Publish Audio - Ensure track exists and is enabled
    // Note: usePublish automatically publishes when the track is ready and component mounts
    // We only need to control mute/unmute via setEnabled
    usePublish([localMicrophoneTrack]);

    // 4. Mute Toggle logic
    useEffect(() => {
        if (localMicrophoneTrack) {
            localMicrophoneTrack.setEnabled(micOn);
            setDebugStatus(micOn ? 'Mic LIVE' : 'Mic Muted');
            console.log("Mic Status:", micOn ? "LIVE" : "MUTED");
        }
    }, [micOn, localMicrophoneTrack]);

    // 5. Remote Users (to show who is talking)
    const remoteUsers = useRemoteUsers();

    if (!isConnected && isLoading) {
        return <div className="text-[10px] md:text-xs text-brand-500 animate-pulse bg-white/50 px-2 py-1 rounded-full">{debugStatus}</div>;
    }

    if (error) {
        return (
            <div className="text-[10px] md:text-xs text-red-500 flex items-center gap-1 bg-red-50 px-2 py-1 rounded-full border border-red-100" title={error.message}>
                <FaMicrophoneSlash />
                {error.message.includes('dynamic key') ? 'Auth Err' : 'Net Err'}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/30 shadow-lg relative transition-all">
            {/* Interaction Overlay for Mobile Audio (Autoplay fix) - Covers explicitly ensuring audio context resumes */}
            {remoteUsers.length > 0 && (
                <button
                    className="absolute inset-0 w-full h-full opacity-0 z-0"
                    onClick={() => {
                        // Dummy click to resume audio context if suspended
                        console.log("Resuming Audio Context via user interaction");
                    }}
                />
            )}

            {/* Status Indicator */}
            <div className={`w-2 h-2 rounded-full relative z-10 ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-orange-500 animate-pulse'}`} />

            {/* Mic Toggle */}
            <button
                onClick={(e) => {
                    e.stopPropagation(); // Prevent overlay click
                    setMicOn(!micOn);
                }}
                className={`p-2 rounded-full transition-all active:scale-95 relative z-10 ${micOn ? 'bg-brand-500 text-white shadow-md' : 'bg-red-500/10 text-red-500'}`}
                title={micOn ? "Mute Mic" : "Unmute Mic"}
            >
                {micOn ? <FaMicrophone size={14} /> : <FaMicrophoneSlash size={14} />}
            </button>

            {/* Remote Users Count */}
            <div className="flex items-center text-xs font-bold text-slate-700 ml-1 relative z-10">
                <FaHeadphones className="mr-1 text-slate-500" />
                {remoteUsers.length}
            </div>

            {/* Debug Text for Mobile (Temporary) */}
            {/* <div className="hidden md:block absolute -top-8 left-0 text-[10px] bg-black/80 text-white p-1 rounded whitespace-nowrap">
                {remoteUsers.length} users, {isConnected ? 'conn' : 'dc'}
            </div> */}

            {/* Hidden Audio Player */}
            <RemoteAudioTracks users={remoteUsers} />
        </div>
    );
};

// Helper to convert String UID to 16-bit Integer (Agora friendly range [0, 65535])
function stringToNumber(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    // Strict range limit as per error message
    return Math.abs(hash) % 65000;
}

// Wrapper Component that provides the client
export const VoiceChatWidget = ({ channelName }: { channelName: string }) => {
    // FIX: Use useMemo to prevent recreating client on every render
    // Cast to any to avoid strict type mismatch between sdk-ng and react-wrapper
    const [client] = useState(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));

    if (!channelName) return null;

    return (
        <AgoraRTCProvider client={client as any}>
            <VoiceChatInner channelName={channelName} />
        </AgoraRTCProvider>
    );
};

// ... VoiceChatInner updates ...
// I need to update VoiceChatInner to use stringToNumber(user.uid)
