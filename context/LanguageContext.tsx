'use client';

import React, { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import { translations, Language } from '@/data/translations';

interface LanguageContextType {
    language: Language;
    toggleLanguage: () => void;
    setLanguage: (lang: Language) => void;
    t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>('en');

    const toggleLanguage = useCallback(() => {
        setLanguageState((prev) => (prev === 'en' ? 'hi' : 'en'));
    }, []);

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
    }, []);

    // Helper to get nested translation value by string path (e.g., 'welcome.title')
    const t = useCallback((path: string): string => {
        const keys = path.split('.');
        let current: unknown = translations[language];

        for (const key of keys) {
            if (typeof current !== 'object' || current === null || !(key in current)) {
                console.warn(`Translation missing for key: ${path} in language: ${language}`);
                return path; // Fallback to key if missing
            }
            current = (current as Record<string, unknown>)[key];
        }

        return typeof current === 'string' ? current : path;
    }, [language]);

    const value = useMemo(() => ({ language, toggleLanguage, setLanguage, t }), [language, toggleLanguage, setLanguage, t]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
