'use client';

import { useState, useEffect } from 'react';

interface SafeAvatarProps {
    src?: string;
    alt: string;
    className?: string;
}

export const SafeAvatar = ({ src, alt, className }: SafeAvatarProps) => {
    const [imgSrc, setImgSrc] = useState(src || `https://ui-avatars.com/api/?name=${alt}`);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setImgSrc(src || `https://ui-avatars.com/api/?name=${alt}`);
        setHasError(false);
    }, [src, alt]);

    return (
        <img
            src={hasError ? `https://ui-avatars.com/api/?name=${alt}` : imgSrc}
            alt={alt}
            className={className}
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
        />
    );
};
