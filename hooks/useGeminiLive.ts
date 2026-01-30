'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GEMINI_LIVE_CONFIG } from '@/lib/gemini-live';

interface ConnectContext {
    class?: string;
    board?: string;
    subject?: string;
}

interface UseGeminiLiveReturn {
    isConnected: boolean;
    isConnecting: boolean;
    connect: (context?: ConnectContext) => Promise<void>;
    disconnect: () => void;
    sendAudioChunk: (data: ArrayBuffer) => void;
    error: string | null;
    isSpeaking: boolean;
    volume: number;
}

export function useGeminiLive(): UseGeminiLiveReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [volume, setVolume] = useState(0);

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<ArrayBuffer[]>([]);
    const isPlayingRef = useRef(false);
    const nextStartTimeRef = useRef(0);

    // Initialize Audio Context for playback
    const ensureAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext({
                sampleRate: GEMINI_LIVE_CONFIG.audio.outputSampleRate,
            });
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        return audioContextRef.current;
    }, []);

    // Play next chunk in queue
    const playNextChunk = useCallback(() => {
        if (audioQueueRef.current.length === 0 || !audioContextRef.current) {
            isPlayingRef.current = false;
            setIsSpeaking(false);
            return;
        }

        isPlayingRef.current = true;
        setIsSpeaking(true);

        const chunk = audioQueueRef.current.shift()!;
        const float32Data = new Float32Array(chunk);

        // Calculate volume for visualization
        let sum = 0;
        for (let i = 0; i < float32Data.length; i++) {
            sum += Math.abs(float32Data[i]);
        }
        setVolume(Math.min(1, sum / float32Data.length * 5));

        const buffer = audioContextRef.current.createBuffer(
            1,
            float32Data.length,
            GEMINI_LIVE_CONFIG.audio.outputSampleRate
        );
        buffer.getChannelData(0).set(float32Data);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);

        const currentTime = audioContextRef.current.currentTime;
        const startTime = Math.max(currentTime, nextStartTimeRef.current);

        source.start(startTime);
        nextStartTimeRef.current = startTime + buffer.duration;

        source.onended = () => {
            playNextChunk();
        };
    }, []);


    const connect = useCallback(async (context?: ConnectContext) => {
        try {
            if (wsRef.current?.readyState === WebSocket.OPEN) return;

            setIsConnecting(true);
            setError(null);

            // Fetch API Key
            const res = await fetch('/api/ai/live-key');
            if (!res.ok) throw new Error('Failed to get API key');
            const { key } = await res.json();

            // Build URL - using v1beta for the native audio model
            const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${key}`;

            const ws = new WebSocket(url);

            ws.onopen = () => {
                console.log('Gemini Live WebSocket Connected');
                setIsConnected(true);
                setIsConnecting(false);

                // Build system instruction
                let customInstruction = GEMINI_LIVE_CONFIG.systemInstruction;
                if (context) {
                    customInstruction += `\n\nCURRENT STUDENT PROFILE:\n`;
                    if (context.class) customInstruction += `- Class: ${context.class}\n`;
                    if (context.board) customInstruction += `- Board: ${context.board}\n`;
                    if (context.subject) customInstruction += `- Interest: ${context.subject}\n`;
                    customInstruction += `\nADAPTIVITY RULES:\n1. Adjust explanation depth to Class ${context.class || '10'} level.\n2. Keep responses CONCISE and spoken naturally.\n3. Identify yourself as their "Live Guru".`;
                }

                // Setup message for gemini-2.0-flash-exp
                const setupMessage = {
                    setup: {
                        model: `models/${GEMINI_LIVE_CONFIG.model}`,
                        generation_config: {
                            response_modalities: ["AUDIO"],
                            speech_config: {
                                voice_config: {
                                    prebuilt_voice_config: {
                                        voice_name: "Puck"
                                    }
                                }
                            }
                        },
                        system_instruction: {
                            parts: [{ text: customInstruction }]
                        }
                    }
                };

                console.log('Sending setup message...');
                ws.send(JSON.stringify(setupMessage));
            };

            ws.onmessage = async (event) => {
                let data = event.data;

                if (data instanceof Blob) {
                    data = await data.text();
                }

                try {
                    const response = JSON.parse(data);
                    console.log('Received:', response);

                    // Handle setup complete
                    if (response.setupComplete) {
                        console.log('Setup complete, ready for audio');
                    }

                    // Handle interruption
                    if (response.serverContent?.interrupted) {
                        audioQueueRef.current.length = 0;
                        setIsSpeaking(false);
                    }

                    // Handle model audio response
                    if (response.serverContent?.modelTurn?.parts) {
                        for (const part of response.serverContent.modelTurn.parts) {
                            if (part.inlineData && part.inlineData.data) {
                                // Decode Base64 audio
                                const binaryString = atob(part.inlineData.data);
                                const len = binaryString.length;
                                const bytes = new Uint8Array(len);
                                for (let i = 0; i < len; i++) {
                                    bytes[i] = binaryString.charCodeAt(i);
                                }

                                // Convert PCM16 to Float32
                                const pcm16 = new Int16Array(bytes.buffer);
                                const float32 = new Float32Array(pcm16.length);
                                for (let i = 0; i < pcm16.length; i++) {
                                    float32[i] = pcm16[i] / 32768.0;
                                }

                                audioQueueRef.current.push(float32.buffer);
                                if (!isPlayingRef.current) {
                                    ensureAudioContext();
                                    playNextChunk();
                                }
                            }
                        }
                    }

                    // Turn complete
                    if (response.serverContent?.turnComplete) {
                        console.log('Turn complete');
                    }
                } catch (e) {
                    console.error('Error parsing message:', e);
                }
            };

            ws.onerror = (e) => {
                console.error('WebSocket Error', e);
                setError('Connection error');
                setIsConnecting(false);
            };

            ws.onclose = (event) => {
                console.log('Disconnected', 'Code:', event.code, 'Reason:', event.reason);
                setIsConnected(false);
                setIsConnecting(false);
                if (event.reason) {
                    setError(event.reason);
                }
            };

            wsRef.current = ws;

        } catch (err) {
            console.error('Connection failed', err);
            setError(err instanceof Error ? err.message : 'Failed to connect');
            setIsConnecting(false);
        }
    }, [ensureAudioContext, playNextChunk]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        setIsConnected(false);
        setIsSpeaking(false);
        setVolume(0);
    }, []);

    const sendAudioChunk = useCallback((data: ArrayBuffer) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        // Convert PCM16 ArrayBuffer to Base64
        const bytes = new Uint8Array(data);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64Audio = btoa(binary);

        // Format from official Google docs: sendRealtimeInput({ audio: { data, mimeType } })
        const message = {
            realtimeInput: {
                audio: {
                    data: base64Audio,
                    mimeType: "audio/pcm;rate=16000"
                }
            }
        };

        wsRef.current.send(JSON.stringify(message));
    }, []);

    return {
        isConnected,
        isConnecting,
        connect,
        disconnect,
        sendAudioChunk,
        error,
        isSpeaking,
        volume
    };
}
