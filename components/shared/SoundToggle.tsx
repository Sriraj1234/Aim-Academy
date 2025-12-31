'use client';

import { motion } from 'framer-motion';
import { useSound } from '@/hooks/useSound';
import { HiVolumeUp, HiVolumeOff } from 'react-icons/hi';

/**
 * Sound toggle button with animation
 */
export function SoundToggle({ className = '' }: { className?: string }) {
    const { isMuted, toggleMute, isLoaded } = useSound();

    if (!isLoaded) return null;

    return (
        <motion.button
            onClick={toggleMute}
            className={`relative p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${className}`}
            whileTap={{ scale: 0.95 }}
            aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
        >
            <div className="relative w-6 h-6">
                {/* Volume On icon */}
                <motion.div
                    initial={false}
                    animate={{
                        scale: !isMuted ? 1 : 0,
                        opacity: !isMuted ? 1 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center text-emerald-500"
                >
                    <HiVolumeUp size={20} />
                </motion.div>

                {/* Volume Off icon */}
                <motion.div
                    initial={false}
                    animate={{
                        scale: isMuted ? 1 : 0,
                        opacity: isMuted ? 1 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center text-gray-400"
                >
                    <HiVolumeOff size={20} />
                </motion.div>
            </div>
        </motion.button>
    );
}
