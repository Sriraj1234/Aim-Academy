'use client';

import React, { useState, useEffect } from 'react';
import { FaImage, FaExclamationTriangle } from 'react-icons/fa';

interface SafeImageProps {
    src: string;
    alt: string;
    className?: string;
    width?: number; // Desired width for optimization
}

// External Image Optimization Proxy (wsrv.nl - free, reliable, no-key required)
// Caches, resizes, and converts to WebP for faster loading on slow networks.
const optimizeUrl = (url: string, width: number = 500) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url; // Don't proxy data URIs
    if (url.startsWith('/')) return url; // Don't proxy local images

    // Remove protocol for cleaner proxy URL construction if needed, 
    // but wsrv.nl handles full URLs well.
    // We use w={width} for resizing and q=80 for compression.
    // &output=webp for modern format.
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=80&output=webp`;
};

export const SafeImage: React.FC<SafeImageProps> = ({ src, alt, className = '', width = 500 }) => {
    const [imgSrc, setImgSrc] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!src) {
            setError(true);
            return;
        }

        // Start with optimized URL
        setImgSrc(optimizeUrl(src, width));
        setIsLoading(true);
        setError(false);
    }, [src, width]);

    const handleError = () => {
        // If optimized URL fails, try the original URL as fallback
        // If it's already the original (or if we don't want to fallback to potentially heavy original), just fail.
        // Let's try ONE fallback to original.
        if (imgSrc.includes('wsrv.nl')) {
            setImgSrc(src);
        } else {
            setError(true);
        }
        setIsLoading(false);
    };

    const handleLoad = () => {
        setIsLoading(false);
    };

    if (error) {
        return (
            <div className={`flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 ${className}`}>
                <FaImage className="text-2xl mb-1 opacity-50" />
                <span className="text-[10px]">Image unavailable</span>
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
                    <FaImage className="text-gray-400 animate-bounce" />
                </div>
            )}
            <img
                src={imgSrc}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={handleLoad}
                onError={handleError}
                loading="lazy"
            />
        </div>
    );
};
