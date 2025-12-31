'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
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

    const toggleLanguage = () => {
        setLanguageState((prev) => (prev === 'en' ? 'hi' : 'en'));
    };

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    // Helper to get nested translation value by string path (e.g., 'welcome.title')
    const t = (path: string): string => {
        const keys = path.split('.');
        let current: any = translations[language];

        for (const key of keys) {
            if (current[key] === undefined) {
                console.warn(`Translation missing for key: ${path} in language: ${language}`);
                return path; // Fallback to key if missing
            }
            current = current[key];
        }

        return typeof current === 'string' ? current : path;
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, t }}>
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
