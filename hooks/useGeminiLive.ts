'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GEMINI_LIVE_CONFIG } from '@/lib/gemini-live';

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

export function useGeminiLive(): UseGeminiLiveReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false); // User speaking status
    const [isAiSpeaking, setIsAiSpeaking] = useState(false); // AI speaking status
    const [volume, setVolume] = useState(0);

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

    // Silence detection for "end_of_utterance"
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isSpeakingRef = useRef(false);

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
        setIsConnecting(false);
        setIsAiSpeaking(false);
        setVolume(0);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    }, []);

    const connect = useCallback(async () => {
        try {
            if (isConnected || isConnecting) return;
            setIsConnecting(true);
            setError(null);

            // 1. Get API Key
            const res = await fetch('/api/ai/live-key');
            if (!res.ok) throw Error('Failed to get API Key');
            const { key } = await res.json();

            // 2. Setup Audio Config
            const audioCtx = new AudioContext({ sampleRate: 24000 });
            await audioCtx.audioWorklet.addModule('/gemini-audio-processor.js');
            audioContextRef.current = audioCtx;

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            streamRef.current = stream;

            const source = audioCtx.createMediaStreamSource(stream);
            sourceNodeRef.current = source;

            const workletNode = new AudioWorkletNode(audioCtx, 'gemini-audio-processor');
            workletNodeRef.current = workletNode;

            // 3. Setup WebSocket (New Model Spec)
            const url = `wss://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-native-audio-dialog:stream?key=${key}`;
            const ws = new WebSocket(url);

            ws.onopen = () => {
                console.log('Gemini Live Connected (Native Audio) 🎧');
                setIsConnected(true);
                setIsConnecting(false);

                // Initial Setup Config
                const setupMsg = {
                    system_instruction: {
                        text: GEMINI_LIVE_CONFIG.systemInstruction
                    }
                };
                ws.send(JSON.stringify(setupMsg));
            };

            ws.onmessage = async (event) => {
                let data = event.data;
                if (data instanceof Blob) data = await data.text();

                try {
                    const response = JSON.parse(data);

                    // Handle Audio Output
                    if (response.output_audio_buffer?.audio_data) {
                        setIsAiSpeaking(true);
                        const binary = atob(response.output_audio_buffer.audio_data);
                        const bytes = new Uint8Array(binary.length);
                        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                        const int16 = new Int16Array(bytes.buffer);

                        // Convert to Float32 for playback
                        const float32 = new Float32Array(int16.length);
                        for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768.0;

                        workletNode.port.postMessage({
                            type: 'output_audio',
                            buffer: float32.buffer
                        }, [float32.buffer]);
                    }
                } catch (e) {
                    // console.error("Parse error", e);
                }
            };

            ws.onclose = (e) => {
                console.log("WS Closed", e.code, e.reason);
                cleanup();
            };

            ws.onerror = (e) => {
                console.error("WS Error", e);
                // alert("Connection Error");
                cleanup();
            };

            wsRef.current = ws;

            // Audio Processing Logic
            workletNode.port.onmessage = (event) => {
                if (event.data.type === 'input_audio') {
                    const float32 = new Float32Array(event.data.buffer);

                    // Volume / VAD Logic
                    let sum = 0;
                    for (let i = 0; i < float32.length; i += 10) sum += Math.abs(float32[i]);
                    const avg = sum / (float32.length / 10);
                    setVolume(avg * 10);

                    const isNowSpeaking = avg > 0.015; // Threshold
                    setIsSpeaking(isNowSpeaking);

                    // Silence Detection for End of Utterance
                    if (isNowSpeaking) {
                        isSpeakingRef.current = true;
                        if (silenceTimerRef.current) {
                            clearTimeout(silenceTimerRef.current);
                            silenceTimerRef.current = null;
                        }
                    } else if (isSpeakingRef.current) {
                        // User WAS speaking, now stopped. Start timer.
                        if (!silenceTimerRef.current) {
                            silenceTimerRef.current = setTimeout(() => {
                                isSpeakingRef.current = false;
                                console.log("End of Utterance sent 🛑");
                                wsRef.current?.send(JSON.stringify({ event: "end_of_utterance" }));
                            }, 700); // 700ms silence = end of turn
                        }
                    }

                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        const int16 = resampleTo16k(float32, audioCtx.sampleRate);
                        const base64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));

                        wsRef.current.send(JSON.stringify({
                            input_audio_buffer: {
                                audio_data: base64,
                                encoding: "LINEAR16",
                                sample_rate_hz: 16000
                            }
                        }));
                    }
                }
            };

            source.connect(workletNode);
            workletNode.connect(audioCtx.destination);

        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setIsConnecting(false);
            cleanup();
        }
    }, [cleanup]);

    return {
        isConnected,
        isConnecting,
        connect,
        disconnect: cleanup,
        error,
        isSpeaking,
        isAiSpeaking,
        volume
    };
}
