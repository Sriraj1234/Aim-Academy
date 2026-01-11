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
        // Use absolute inset-0 to fill the parent, or fallback to explicit sizing via className
        return (
            <div
                className={`flex items-center justify-center text-white font-bold text-sm uppercase ${className}`}
                style={{ backgroundColor: stringToColor(alt) }}
            >
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

// Helper to generate consistent, vibrant colors from names
function stringToColor(str: string) {
    // Predefined vibrant color palette
    const colors = [
        '#6366F1', // Indigo
        '#8B5CF6', // Violet
        '#EC4899', // Pink
        '#EF4444', // Red
        '#F97316', // Orange
        '#EAB308', // Yellow
        '#22C55E', // Green
        '#14B8A6', // Teal
        '#06B6D4', // Cyan
        '#3B82F6', // Blue
    ];

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}
