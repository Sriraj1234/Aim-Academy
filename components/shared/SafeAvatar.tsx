'use client';

import { useState, useEffect } from 'react';

interface SafeAvatarProps {
    src?: string;
    alt: string;
    className?: string;
}

export const SafeAvatar = ({ src, alt, className }: SafeAvatarProps) => {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [src]);

    if (!src || hasError) {
        return (
            <div className={`flex items-center justify-center bg-pw-indigo text-white font-bold text-sm uppercase ${className}`} style={{ backgroundColor: stringToColor(alt) }}>
                {(alt || 'U').charAt(0)}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
        />
    );
};

// Helper to generate consistent colors from names
function stringToColor(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
}
