'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type SoundType = 'click' | 'correct' | 'wrong' | 'tick' | 'win' | 'lose';

interface SoundContextType {
    isMuted: boolean;
    toggleMute: () => void;
    playSound: (type: SoundType) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider = ({ children }: { children: ReactNode }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [audioElements, setAudioElements] = useState<Record<string, HTMLAudioElement>>({});

    useEffect(() => {
        // Load preference
        const stored = localStorage.getItem('sound_muted');
        if (stored) setIsMuted(stored === 'true');

        // Preload sounds
        const sounds: Record<string, string> = {
            click: '/sounds/click.mp3',
            correct: '/sounds/correct.mp3',
            wrong: '/sounds/wrong.mp3',
            tick: '/sounds/tick.mp3',
            win: '/sounds/win.mp3',
            lose: '/sounds/lose.mp3',
        };

        const loaded: Record<string, HTMLAudioElement> = {};
        Object.keys(sounds).forEach(key => {
            const audio = new Audio(sounds[key]);
            loaded[key] = audio;
        });
        setAudioElements(loaded);

    }, []);

    const toggleMute = () => {
        setIsMuted(prev => {
            const newState = !prev;
            localStorage.setItem('sound_muted', String(newState));
            return newState;
        });
    };

    const playSound = (type: SoundType) => {
        if (isMuted || !audioElements[type]) return;

        const audio = audioElements[type];
        audio.currentTime = 0;
        audio.play().catch(e => {
            // Provide a very quiet console log or ignore, as browsers block autoplay often
            // console.warn("Audio play blocked", e);
        });
    };

    return (
        <SoundContext.Provider value={{ isMuted, toggleMute, playSound }}>
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
