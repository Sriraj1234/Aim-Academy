'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSpeechOptions {
    lang?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
}

/**
 * Custom hook for Text-to-Speech functionality
 */
export function useSpeech(options: UseSpeechOptions = {}) {
    const { lang = 'hi-IN', rate = 1, pitch = 1, volume = 1 } = options;

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Check support and load voices
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            setIsSupported(true);

            const loadVoices = () => {
                const availableVoices = window.speechSynthesis.getVoices();
                setVoices(availableVoices);
            };

            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;

            return () => {
                window.speechSynthesis.onvoiceschanged = null;
            };
        }
    }, []);

    // Find best voice for language
    const getBestVoice = useCallback((targetLang: string) => {
        // Priority: native voice > Google voice > any matching voice
        const hindiVoices = voices.filter(v =>
            v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')
        );

        const englishVoices = voices.filter(v =>
            v.lang.startsWith('en-IN') || v.lang.startsWith('en')
        );

        if (targetLang.startsWith('hi') && hindiVoices.length > 0) {
            return hindiVoices.find(v => v.name.includes('Google')) || hindiVoices[0];
        }

        if (englishVoices.length > 0) {
            return englishVoices.find(v => v.name.includes('Google')) || englishVoices[0];
        }

        return voices[0];
    }, [voices]);

    // Speak text
    const speak = useCallback((text: string, voiceLang?: string) => {
        if (!isSupported) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = voiceLang || lang;
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        const selectedVoice = getBestVoice(voiceLang || lang);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [isSupported, lang, rate, pitch, volume, getBestVoice]);

    // Stop speaking
    const stop = useCallback(() => {
        if (isSupported) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, [isSupported]);

    // Pause speaking
    const pause = useCallback(() => {
        if (isSupported) {
            window.speechSynthesis.pause();
        }
    }, [isSupported]);

    // Resume speaking
    const resume = useCallback(() => {
        if (isSupported) {
            window.speechSynthesis.resume();
        }
    }, [isSupported]);

    return {
        speak,
        stop,
        pause,
        resume,
        isSpeaking,
        isSupported,
        voices,
    };
}

/**
 * Detect if text is primarily Hindi
 */
export function isHindiText(text: string): boolean {
    const hindiPattern = /[\u0900-\u097F]/;
    const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
    const totalChars = text.replace(/\s/g, '').length;
    return hindiChars / totalChars > 0.3 || hindiPattern.test(text);
}
