import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaClock } from 'react-icons/fa';

interface ModernTimerProps {
    duration: number; // Total time in seconds
    current?: number; // Optional: Controlled current time
    onTimeUp?: () => void;
    className?: string; // Expect width to be handled by parent via className
}

export const ModernTimer: React.FC<ModernTimerProps> = ({ duration, current, onTimeUp, className = '' }) => {
    // If 'current' is provided, we use it. Otherwise, we maintain internal state.
    const isControlled = current !== undefined;
    const [internalTimeLeft, setInternalTimeLeft] = useState(duration);

    // Effective time left
    const timeLeft = isControlled ? current : internalTimeLeft;

    // Calculate progress percentage
    const progress = (timeLeft / duration) * 100;

    // Determine state
    const isWarning = timeLeft <= 10;
    const isCritical = timeLeft <= 5;

    useEffect(() => {
        if (isControlled) return; // Do not run internal interval if controlled

        if (timeLeft <= 0) {
            onTimeUp?.();
            return;
        }

        const timer = setInterval(() => {
            setInternalTimeLeft((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [isControlled, timeLeft, onTimeUp]);

    // Format time MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`relative ${className}`}>
            <div className={`
                relative overflow-hidden rounded-full shadow-md border 
                ${isCritical ? 'border-red-500 shadow-red-500/20' : 'border-pw-border shadow-pw-indigo/10'}
                transition-all duration-300 w-28 h-8 flex items-center justify-center
            `}>
                {/* Background Progress */}
                <motion.div
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: isControlled ? 0.5 : 1, ease: "linear" }}
                    className={`
                        absolute left-0 top-0 bottom-0
                        ${isCritical ? 'bg-red-100' : isWarning ? 'bg-amber-100' : 'bg-pw-indigo/10'}
                        transition-colors duration-500 origin-left
                    `}
                />
                
                {/* Foreground Text */}
                <div className={`
                    relative z-10 flex items-center gap-1.5 font-mono font-bold text-sm leading-none
                    ${isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-pw-indigo'}
                    transition-colors duration-300
                `}>
                    <FaClock className={isCritical ? 'animate-pulse' : ''} size={12} />
                    <span>{formatTime(timeLeft)}</span>
                </div>
                
                {/* Critical Warning Pulse Overlay */}
                {isCritical && (
                    <div className="absolute inset-0 rounded-full border border-red-500/50 animate-ping pointer-events-none opacity-50"></div>
                )}
            </div>
        </div>
    );
};
