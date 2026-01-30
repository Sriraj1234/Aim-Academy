'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GEMINI_LIVE_CONFIG, buildPersonalizedPrompt } from '@/lib/gemini-live';
import { UserProfile } from '@/data/types';

interface UseGeminiLiveReturn {
    isConnected: boolean;
    isConnecting: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    error: string | null;
    isSpeaking: boolean;
    isAiSpeaking: boolean;
    volume: number;
}

interface UseGeminiLiveOptions {
    userProfile?: UserProfile | null;
}

export function useGeminiLive(options: UseGeminiLiveOptions = {}): UseGeminiLiveReturn {
    const { userProfile } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [volume, setVolume] = useState(0);

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

    // Helper: Resample audio to 16kHz Int16
    const resampleTo16k = (audioData: Float32Array, sampleRate: number): Int16Array => {
        const ratio = sampleRate / 16000;
        const newLength = Math.round(audioData.length / ratio);
        const result = new Int16Array(newLength);
        for (let i = 0; i < newLength; i++) {
            const index = Math.floor(i * ratio);
            const val = Math.max(-1, Math.min(1, audioData[index]));
            result[i] = val < 0 ? val * 0x8000 : val * 0x7FFF;
        }
        return result;
    };

    const cleanup = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }
        if (sourceNodeRef.current) {
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        setIsConnected(false);
        setIsAiSpeaking(false);
        setIsSpeaking(false);
        setVolume(0);
    }, []);

    const connect = useCallback(async () => {
        if (isConnected || isConnecting) return;
        setIsConnecting(true);
        setError(null);

        try {
            // Fetch API Key from backend
            const keyRes = await fetch('/api/ai/live-key');
            const { key } = await keyRes.json();
            if (!key) throw new Error('No API key found');

            // 1. Get Microphone with enhanced noise handling
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,  // Auto adjust mic gain
                }
            });
            streamRef.current = stream;

            // 2. Setup AudioContext & AudioWorklet
            const audioCtx = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioCtx;

            await audioCtx.audioWorklet.addModule('/gemini-audio-processor.js');

            const source = audioCtx.createMediaStreamSource(stream);
            sourceNodeRef.current = source;

            const workletNode = new AudioWorkletNode(audioCtx, 'gemini-audio-processor', {
                outputChannelCount: [2] // Force stereo output
            });
            workletNodeRef.current = workletNode;

            // 3. Setup WebSocket (OFFICIAL ENDPOINT)
            // Using v1beta for Live API
            const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${key}`;
            const ws = new WebSocket(url);

            ws.onopen = () => {
                console.log('Gemini Live Connected (Official) 🟢');
                setIsConnected(true);
                setIsConnecting(false);

                // Build personalized system instruction with user profile
                const personalizedInstruction = buildPersonalizedPrompt(userProfile);

                // Initial Setup Config (Bidi Protocol) with VAD settings
                const setupMsg = {
                    setup: {
                        model: GEMINI_LIVE_CONFIG.model,
                        generation_config: {
                            response_modalities: ["AUDIO"],
                            speech_config: {
                                voice_config: {
                                    prebuilt_voice_config: { voice_name: "Aoede" }
                                }
                            }
                        },
                        // Voice Activity Detection settings to handle background noise
                        realtimeInputConfig: {
                            automaticActivityDetection: {
                                disabled: false,
                                startOfSpeechSensitivity: "START_SENSITIVITY_LOW", // Less sensitive to noise
                                endOfSpeechSensitivity: "END_SENSITIVITY_LOW", // Wait longer before ending
                                prefixPaddingMs: 300,  // Buffer before speech
                                silenceDurationMs: 1500 // Wait 1.5s of silence before considering turn complete
                            }
                        },
                        system_instruction: {
                            parts: [{ text: personalizedInstruction }]
                        }
                    }
                };
                ws.send(JSON.stringify(setupMsg));
            };

            ws.onmessage = async (event) => {
                let data = event.data;
                if (data instanceof Blob) data = await data.text();

                try {
                    const response = JSON.parse(data);

                    // Handle Audio Response
                    if (response.serverContent?.modelTurn?.parts) {
                        for (const part of response.serverContent.modelTurn.parts) {
                            if (part.inlineData?.mimeType?.startsWith('audio/')) {
                                setIsAiSpeaking(true);

                                // Decode base64 audio
                                const base64 = part.inlineData.data;
                                const binaryStr = atob(base64);
                                const bytes = new Uint8Array(binaryStr.length);
                                for (let i = 0; i < binaryStr.length; i++) {
                                    bytes[i] = binaryStr.charCodeAt(i);
                                }

                                // Send to AudioWorklet for playback
                                workletNodeRef.current?.port.postMessage({
                                    type: 'audioData',
                                    audio: bytes.buffer
                                });
                            }
                        }
                    }

                    // Detect when AI finishes speaking
                    if (response.serverContent?.turnComplete) {
                        setTimeout(() => setIsAiSpeaking(false), 500);
                    }
                } catch (e) {
                    console.log('Non-JSON or partial message');
                }
            };

            ws.onerror = (e) => {
                console.error("WS Error", e);
                // alert("Connection Error");
                cleanup();
            };

            ws.onclose = (e) => {
                console.log("WS Closed", e.code, e.reason);
                cleanup();
            };

            wsRef.current = ws;

            // 4. Connect Microphone -> Worklet -> WS
            source.connect(workletNode);
            workletNode.connect(audioCtx.destination); // For playback

            // Handle audio chunks from worklet
            workletNode.port.onmessage = (e) => {
                if (e.data.type === 'audioChunk' && wsRef.current?.readyState === WebSocket.OPEN) {
                    const floatData = new Float32Array(e.data.audio);
                    const int16Data = resampleTo16k(floatData, 16000);

                    // Calculate volume for UI
                    let sum = 0;
                    for (let i = 0; i < floatData.length; i++) {
                        sum += floatData[i] * floatData[i];
                    }
                    const rms = Math.sqrt(sum / floatData.length);
                    setVolume(Math.min(1, rms * 5));
                    setIsSpeaking(rms > 0.01);

                    // Send to Gemini
                    const base64 = btoa(String.fromCharCode(...new Uint8Array(int16Data.buffer)));
                    const msg = {
                        realtimeInput: {
                            mediaChunks: [{
                                mimeType: "audio/pcm;rate=16000",
                                data: base64
                            }]
                        }
                    };
                    wsRef.current.send(JSON.stringify(msg));
                }
            };

        } catch (err: any) {
            console.error("Connection failed:", err);
            setError(err.message || "Failed to connect");
            setIsConnecting(false);
            cleanup();
        }
    }, [isConnected, isConnecting, cleanup, userProfile]);

    const disconnect = useCallback(() => {
        cleanup();
    }, [cleanup]);

    // Cleanup on unmount
    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    return {
        isConnected,
        isConnecting,
        connect,
        disconnect,
        error,
        isSpeaking,
        isAiSpeaking,
        volume
    };
}
