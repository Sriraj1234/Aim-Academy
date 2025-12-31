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
const RemoteAudioTracks = ({ users }: { users: any[] }) => {
    const { audioTracks } = useRemoteAudioTracks(users);

    useEffect(() => {
        audioTracks.map((track) => track.play());
        return () => {
            audioTracks.map((track) => track.stop());
        };
    }, [audioTracks]);

    return null;
};

// This component handles the actual connection logic
const VoiceChatInner = ({ channelName }: { channelName: string }) => {
    const { user, userProfile } = useAuth();
    const client = useRTCClient();

    // 1. Join with Token
    const [token, setToken] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState('');

    // Generate Numeric UID from User ID (Persistent)
    const numericUid = user?.uid ? stringToNumber(user.uid) : 0;

    useEffect(() => {
        const fetchToken = async () => {
            if (!channelName || !numericUid) return;
            console.log("Fetching token for:", { channelName, uid: numericUid });
            try {
                // Fetch from our own API using the Numeric UID
                const res = await fetch(`/api/agora?channelName=${channelName}&uid=${numericUid}`);

                if (!res.ok) {
                    const text = await res.text();
                    console.error("Token API Error:", text);
                    setFetchError(`Server Error: ${res.status}`);
                    return;
                }

                const data = await res.json();
                if (data.token) {
                    setToken(data.token);
                } else {
                    setFetchError(data.error || 'Failed to get token');
                }
            } catch (e) {
                console.error(e);
                setFetchError('Network error fetching token');
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
    const { localMicrophoneTrack } = useLocalMicrophoneTrack(true); // Auto-create track
    const [micOn, setMicOn] = useState(false); // Start MUTED by default usually? Or unmuted? Let's say muted first.

    // 3. Publish Audio
    usePublish([localMicrophoneTrack]);

    // 4. Mute Toggle logic
    // We don't publish if micOn is false? OR we publish but mute the track? 
    // usePublish publishes if the track exists.
    // We should enable/disable the track.
    useEffect(() => {
        if (localMicrophoneTrack) {
            localMicrophoneTrack.setEnabled(micOn);
        }
    }, [micOn, localMicrophoneTrack]);

    // 5. Remote Users (to show who is talking)
    const remoteUsers = useRemoteUsers();

    if (!isConnected && isLoading) {
        return <div className="text-xs text-brand-500 animate-pulse">Connecting audio...</div>;
    }

    if (error) {
        return (
            <div className="text-xs text-red-500 flex items-center gap-1" title={error.message}>
                <FaMicrophoneSlash />
                {error.message.includes('dynamic key') ? 'Auth Error' : error.message.slice(0, 15) + '...'}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
            {/* Status Indicator */}
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-orange-500'} animate-pulse`} />

            {/* Mic Toggle */}
            <button
                onClick={() => setMicOn(!micOn)}
                className={`p-2 rounded-full transition-all active:scale-95 ${micOn ? 'bg-brand-100 text-brand-600' : 'bg-red-100 text-red-500'}`}
                title={micOn ? "Mute Mic" : "Unmute Mic"}
            >
                {micOn ? <FaMicrophone size={14} /> : <FaMicrophoneSlash size={14} />}
            </button>

            {/* Remote Users Count (or Avatars) */}
            <div className="flex items-center text-xs font-bold text-gray-600 ml-1">
                <FaHeadphones className="mr-1 text-gray-400" />
                {remoteUsers.length}
            </div>

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
