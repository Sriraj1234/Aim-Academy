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
        setVolume(Math.min(1, sum / float32Data.length * 5)); // Boost visual volume

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
        // Schedule next chunk to play right after current one
        const startTime = Math.max(currentTime, nextStartTimeRef.current);

        source.start(startTime);
        nextStartTimeRef.current = startTime + buffer.duration;

        source.onended = () => {
            playNextChunk();
        };
    }, []);

    // Queue audio for playback
    const queueAudio = useCallback((data: ArrayBuffer) => {
        // Convert PCM or receive Float32 directly?
        // Gemini sends Int16 PCM usually, but let's assume raw PCM for now.
        // Actually, the model output config in lib says 24kHz.
        // We receive base64 encoded PCM16 usually in the JSON response.

        // For simplicity assuming we get PCM16 ArrayBuffer from the parsing logic
        // But wait, the WebSocket logic needs to PARSE the message.
        // Let's implement the parsing inside the onmessage.
    }, [playNextChunk]);


    const connect = useCallback(async (context?: ConnectContext) => {
        try {
            if (wsRef.current?.readyState === WebSocket.OPEN) return;

            setIsConnecting(true);
            setError(null);

            // Fetch API Key
            const res = await fetch('/api/ai/live-key');
            if (!res.ok) throw new Error('Failed to get API key');
            const { key } = await res.json();

            // Build URL
            const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${key}`;

            const ws = new WebSocket(url);

            ws.onopen = () => {
                console.log('Gemini Live Connected');
                setIsConnected(true);
                setIsConnecting(false);

                // Build detailed system instruction
                let customInstruction = GEMINI_LIVE_CONFIG.systemInstruction;
                if (context) {
                    customInstruction += `\n\nCURRENT STUDENT PROFILE:\n`;
                    if (context.class) customInstruction += `- Class: ${context.class}\n`;
                    if (context.board) customInstruction += `- Board: ${context.board}\n`;
                    if (context.subject) customInstruction += `- Interest: ${context.subject}\n`;
                    customInstruction += `\nADAPTIVITY RULES:\n1. Adjust explanation depth to Class ${context.class || '10'} level.\n2. Keep responses CONCISE and spoken naturally.\n3. Identify yourself as their "Live Guru".`;
                }

                // Send Setup Message - Format for native audio model
                const setupMessage = {
                    setup: {
                        model: GEMINI_LIVE_CONFIG.model,
                        generation_config: {
                            response_modalities: ["AUDIO"],
                            speech_config: {
                                voice_config: {
                                    prebuilt_voice_config: {
                                        voice_name: "Aoede"
                                    }
                                }
                            }
                        },
                        system_instruction: {
                            parts: [{ text: customInstruction }]
                        }
                    }
                };
                ws.send(JSON.stringify(setupMessage));
            };

            ws.onmessage = async (event) => {
                // Determine if it's text or binary
                let data = event.data;

                if (data instanceof Blob) {
                    data = await data.arrayBuffer();
                }

                if (data instanceof ArrayBuffer) {
                    // Audio Data usually? Or is it JSON text?
                    // Gemini Live Bidi API sends JSON text messages mostly, containing base64 audio.
                    // But if we send audio as binary, maybe it replies binary?
                    // Documentation says BidiGenerateContent uses JSON over WebSocket.
                    try {
                        const text = new TextDecoder().decode(data);
                        const response = JSON.parse(text);
                        parseResponse(response);
                    } catch (e) {
                        console.error('Error parsing msg', e);
                    }
                } else {
                    const response = JSON.parse(data);
                    parseResponse(response);
                }
            };

            const parseResponse = (response: any) => {
                // Handle ServerContent (Model Turn)
                if (response.serverContent?.modelTurn?.parts) {
                    for (const part of response.serverContent.modelTurn.parts) {
                        if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
                            // Decode Base64 audio
                            const binaryString = atob(part.inlineData.data);
                            const len = binaryString.length;
                            const bytes = new Uint8Array(len);
                            for (let i = 0; i < len; i++) {
                                bytes[i] = binaryString.charCodeAt(i);
                            }
                            // This is PCM16 24kHz
                            // Convert to Float32 for Web Audio API
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

                // Keep-alive or other messages
                if (response.serverContent?.turnComplete) {
                    setIsSpeaking(false);
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

        // Use the newer 'audio' field format for native audio model
        const message = {
            realtime_input: {
                audio: {
                    mime_type: "audio/pcm;rate=16000",
                    data: base64Audio
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
