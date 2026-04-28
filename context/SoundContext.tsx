'use client'
import React, { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect, ReactNode } from 'react';

type SoundType = 'click' | 'correct' | 'wrong' | 'tick' | 'win' | 'lose';

interface SoundContextType {
    isMuted: boolean;
    toggleMute: () => void;
    playSound: (type: SoundType) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider = ({ children }: { children: ReactNode }) => {
    const [isMuted, setIsMuted] = useState(false);
    const audioElementsRef = useRef<Partial<Record<SoundType, HTMLAudioElement>>>({});

    useEffect(() => {
        const timer = setTimeout(() => {
            const stored = localStorage.getItem('sound_muted');
            if (stored) setIsMuted(stored === 'true');
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const newState = !prev;
            localStorage.setItem('sound_muted', String(newState));
            return newState;
        });
    }, []);

    const playSound = useCallback((type: SoundType) => {
        if (isMuted || typeof window === 'undefined') return;

        const sounds: Record<SoundType, string> = {
            click: '/sounds/click.mp3',
            correct: '/sounds/correct.mp3',
            wrong: '/sounds/wrong.mp3',
            tick: '/sounds/tick.mp3',
            win: '/sounds/win.mp3',
            lose: '/sounds/lose.mp3',
        };

        if (!audioElementsRef.current[type]) {
            audioElementsRef.current[type] = new Audio(sounds[type]);
        }

        const audio = audioElementsRef.current[type];
        if (!audio) return;
        audio.currentTime = 0;
        audio.play().catch(() => {
            // Provide a very quiet console log or ignore, as browsers block autoplay often
            // console.warn("Audio play blocked", e);
        });
    }, [isMuted]);

    const value = useMemo(() => ({ isMuted, toggleMute, playSound }), [isMuted, toggleMute, playSound]);

    return (
        <SoundContext.Provider value={value}>
            {children}
        </SoundContext.Provider>
    );
};

export const useSound = () => {
    const context = useContext(SoundContext);
    if (!context) {
        throw new Error('useSound must be used within a SoundProvider');
    }
    return context;
};
