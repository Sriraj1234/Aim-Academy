'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Sound file paths (uses hosted sounds for immediate functionality)
const SOUNDS = {
    correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
    wrong: 'https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3',
    click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
    countdown: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
    gameStart: 'https://assets.mixkit.co/active_storage/sfx/1998/1998-preview.mp3',
    levelUp: 'https://assets.mixkit.co/active_storage/sfx/1987/1987-preview.mp3',
};

type SoundType = keyof typeof SOUNDS;

interface UseSoundOptions {
    volume?: number;
    enabled?: boolean;
}

/**
 * Custom hook for playing sound effects
 * 
 * Usage:
 * const { play, toggleMute, isMuted } = useSound();
 * play('correct'); // Play correct answer sound
 */
export function useSound(options: UseSoundOptions = {}) {
    const { volume = 0.5, enabled = true } = options;

    const [isMuted, setIsMuted] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const audioCache = useRef<Map<SoundType, HTMLAudioElement>>(new Map());

    // Load mute preference from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedMute = localStorage.getItem('sound_muted');
            setIsMuted(savedMute === 'true');
            setIsLoaded(true);
        }
    }, []);

    // Preload audio files
    useEffect(() => {
        if (typeof window === 'undefined' || !enabled) return;

        Object.entries(SOUNDS).forEach(([key, path]) => {
            const audio = new Audio(path);
            audio.volume = volume;
            audio.preload = 'auto';
            audioCache.current.set(key as SoundType, audio);
        });

        return () => {
            audioCache.current.forEach(audio => {
                audio.pause();
                audio.src = '';
            });
            audioCache.current.clear();
        };
    }, [enabled, volume]);

    // Play a sound
    const play = useCallback((sound: SoundType) => {
        if (!enabled || isMuted || typeof window === 'undefined') return;

        try {
            const audio = audioCache.current.get(sound);
            if (audio) {
                audio.currentTime = 0;
                audio.volume = volume;
                audio.play().catch(() => {
                    // Ignore autoplay errors (user hasn't interacted yet)
                });
            } else {
                // Fallback: Create and play new audio
                const newAudio = new Audio(SOUNDS[sound]);
                newAudio.volume = volume;
                newAudio.play().catch(() => { });
            }
        } catch (error) {
            console.warn('Sound play error:', error);
        }
    }, [enabled, isMuted, volume]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const newValue = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem('sound_muted', String(newValue));
            }
            return newValue;
        });
    }, []);

    // Set mute
    const setMute = useCallback((muted: boolean) => {
        setIsMuted(muted);
        if (typeof window !== 'undefined') {
            localStorage.setItem('sound_muted', String(muted));
        }
    }, []);

    return {
        play,
        toggleMute,
        setMute,
        isMuted,
        isLoaded,
    };
}

export { SOUNDS };
export type { SoundType };
