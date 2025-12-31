'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GEMINI_LIVE_CONFIG } from '@/lib/gemini-live';

interface UseAudioRecorderOptions {
    onAudioData?: (audioData: ArrayBuffer) => void;
    chunkIntervalMs?: number;
}

interface UseAudioRecorderReturn {
    isRecording: boolean;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    hasPermission: boolean | null;
    error: string | null;
    audioLevel: number;
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}): UseAudioRecorderReturn {
    const { onAudioData, chunkIntervalMs = 100 } = options;

    const [isRecording, setIsRecording] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [audioLevel, setAudioLevel] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Convert Float32 to Int16 PCM
    const floatTo16BitPCM = useCallback((float32Array: Float32Array): ArrayBuffer => {
        const buffer = new ArrayBuffer(float32Array.length * 2);
        const view = new DataView(buffer);

        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        }

        return buffer;
    }, []);

    // Downsample audio to 16kHz
    const downsample = useCallback((
        inputBuffer: Float32Array,
        inputSampleRate: number,
        outputSampleRate: number
    ): Float32Array => {
        if (inputSampleRate === outputSampleRate) {
            return inputBuffer;
        }

        const ratio = inputSampleRate / outputSampleRate;
        const outputLength = Math.round(inputBuffer.length / ratio);
        const result = new Float32Array(outputLength);

        for (let i = 0; i < outputLength; i++) {
            const inputIndex = Math.floor(i * ratio);
            result[i] = inputBuffer[inputIndex];
        }

        return result;
    }, []);

    // Update audio level for visualization
    const updateAudioLevel = useCallback(() => {
        if (!analyserRef.current || !isRecording) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average level
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setAudioLevel(average / 255);

        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }, [isRecording]);

    // Start recording
    const startRecording = useCallback(async () => {
        try {
            setError(null);

            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: GEMINI_LIVE_CONFIG.audio.inputChannels,
                    sampleRate: { ideal: GEMINI_LIVE_CONFIG.audio.inputSampleRate },
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });

            setHasPermission(true);
            mediaStreamRef.current = stream;

            // Create audio context
            const audioContext = new AudioContext({
                sampleRate: GEMINI_LIVE_CONFIG.audio.inputSampleRate,
            });
            audioContextRef.current = audioContext;

            // Create source from stream
            const source = audioContext.createMediaStreamSource(stream);

            // Create analyser for visualization
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;
            source.connect(analyser);

            // Create script processor for audio data
            const bufferSize = 4096;
            const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
            processorRef.current = processor;

            let audioBuffer: Float32Array[] = [];
            let lastSendTime = Date.now();

            processor.onaudioprocess = (event) => {
                const inputData = event.inputBuffer.getChannelData(0);
                audioBuffer.push(new Float32Array(inputData));

                // Send audio chunks at regular intervals
                const now = Date.now();
                if (now - lastSendTime >= chunkIntervalMs) {
                    // Combine all buffered audio
                    const totalLength = audioBuffer.reduce((sum, arr) => sum + arr.length, 0);
                    const combined = new Float32Array(totalLength);
                    let offset = 0;
                    for (const arr of audioBuffer) {
                        combined.set(arr, offset);
                        offset += arr.length;
                    }

                    // Downsample if needed
                    const downsampled = downsample(
                        combined,
                        audioContext.sampleRate,
                        GEMINI_LIVE_CONFIG.audio.inputSampleRate
                    );

                    // Convert to PCM
                    const pcmData = floatTo16BitPCM(downsampled);
                    onAudioData?.(pcmData);

                    audioBuffer = [];
                    lastSendTime = now;
                }
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

            setIsRecording(true);

            // Start audio level monitoring
            animationFrameRef.current = requestAnimationFrame(updateAudioLevel);

        } catch (err) {
            console.error('Failed to start recording:', err);
            setHasPermission(false);
            setError(err instanceof Error ? err.message : 'Failed to access microphone');
        }
    }, [chunkIntervalMs, downsample, floatTo16BitPCM, onAudioData, updateAudioLevel]);

    // Stop recording
    const stopRecording = useCallback(() => {
        // Stop animation frame
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // Disconnect processor
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        // Stop media stream
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        analyserRef.current = null;
        setIsRecording(false);
        setAudioLevel(0);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopRecording();
        };
    }, [stopRecording]);

    return {
        isRecording,
        startRecording,
        stopRecording,
        hasPermission,
        error,
        audioLevel,
    };
}
