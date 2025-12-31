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
                flex items-center gap-3 bg-white p-1.5 rounded-full shadow-md border 
                ${isCritical ? 'border-red-200 shadow-red-500/20' : 'border-pw-border shadow-pw-indigo/10'}
                transition-all duration-300
            `}>
                {/* Time Badge (Fixed Width) */}
                <div className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full font-mono font-bold text-base leading-none
                    ${isCritical ? 'bg-red-50 text-red-600' : isWarning ? 'bg-amber-50 text-amber-600' : 'bg-pw-indigo/10 text-pw-indigo'}
                    transition-colors duration-300 shrink-0 min-w-[90px] justify-center
                `}>
                    <FaClock className={isCritical ? 'animate-pulse' : ''} size={14} />
                    <span>{formatTime(timeLeft)}</span>
                </div>

                {/* Progress Bar Container */}
                <div className="flex-1 h-2 bg-pw-surface rounded-full overflow-hidden relative min-w-[50px]">
                    <motion.div
                        initial={false} // Disable initial animation to prevent jumping updates
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: isControlled ? 0.5 : 1, ease: "linear" }}
                        className={`
                            h-full rounded-full
                            ${isCritical ? 'bg-red-500' :
                                isWarning ? 'bg-amber-500' :
                                    'bg-pw-indigo'}
                            transition-colors duration-500
                        `}
                    />
                </div>
            </div>

            {/* Critical Warning Pulse Overlay */}
            {isCritical && (
                <div className="absolute inset-0 rounded-full border border-red-500/50 animate-ping pointer-events-none opacity-50"></div>
            )}
        </div>
    );
};
