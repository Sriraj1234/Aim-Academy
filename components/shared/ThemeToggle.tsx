'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { HiMoon, HiSun } from 'react-icons/hi';

/**
 * Theme toggle button with smooth animation
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
    const { resolvedTheme, toggleTheme } = useTheme();

    return (
        <motion.button
            onClick={toggleTheme}
            className={`relative p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${className}`}
            whileTap={{ scale: 0.95 }}
            aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
        >
            <div className="relative w-6 h-6">
                {/* Sun icon */}
                <motion.div
                    initial={false}
                    animate={{
                        scale: resolvedTheme === 'light' ? 1 : 0,
                        rotate: resolvedTheme === 'light' ? 0 : 90,
                        opacity: resolvedTheme === 'light' ? 1 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center text-amber-500"
                >
                    <HiSun size={20} />
                </motion.div>

                {/* Moon icon */}
                <motion.div
                    initial={false}
                    animate={{
                        scale: resolvedTheme === 'dark' ? 1 : 0,
                        rotate: resolvedTheme === 'dark' ? 0 : -90,
                        opacity: resolvedTheme === 'dark' ? 1 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center text-indigo-400"
                >
                    <HiMoon size={20} />
                </motion.div>
            </div>
        </motion.button>
    );
}
