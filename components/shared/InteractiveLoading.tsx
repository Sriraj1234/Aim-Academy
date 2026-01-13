'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLightbulb, FaBrain, FaRocket, FaAtom, FaBookOpen } from 'react-icons/fa';

const FUN_FACTS = [
    "Did you know? Reviewing your mistakes is 10x more effective than just practicing new questions.",
    "Biology Fact: The human brain has about 100 billion neurons.",
    "Physics Fact: Light from the sun takes 8 minutes and 20 seconds to reach Earth.",
    "History Fact: The first computer programmer was Ada Lovelace.",
    "Study Tip: Taking breaks every 25 minutes (Pomodoro) keeps your mind fresh.",
    "Math Fact: Zero (0) is the only number that cannot be represented in Roman numerals.",
    "Chemistry Fact: Water expands when it freezes, unlike most substances.",
    "Geography Fact: The Amazon Rainforest produces 20% of the world's oxygen.",
    "Random Fact: Honey never spoils. Archaeologists have found edible honey in ancient Egyptian tombs!",
    "Pro Tip: Consistency beats intensity. 15 minutes daily > 2 hours once a week."
];

const ICONS = [FaLightbulb, FaBrain, FaRocket, FaAtom, FaBookOpen];

interface InteractiveLoadingProps {
    message?: string;
    fullScreen?: boolean;
}

export function InteractiveLoading({ message = "Loading your personalized content...", fullScreen = true }: InteractiveLoadingProps) {
    const [factIndex, setFactIndex] = useState(0);
    const [iconIndex, setIconIndex] = useState(0);

    useEffect(() => {
        // Change fact every 3 seconds
        const interval = setInterval(() => {
            setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
            setIconIndex((prev) => (prev + 1) % ICONS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const CurrentIcon = ICONS[iconIndex];

    const containerClasses = fullScreen
        ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-pw-surface"
        : "flex flex-col items-center justify-center p-8 bg-pw-surface rounded-2xl";

    return (
        <div className={containerClasses}>
            {/* Animated Icon Ring */}
            <div className="relative mb-8">
                {/* Outer Ring */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 rounded-full border-4 border-pw-indigo/20 border-t-pw-indigo"
                />

                {/* Inner Pulse */}
                <motion.div
                    animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 flex items-center justify-center text-pw-indigo text-2xl"
                >
                    <CurrentIcon />
                </motion.div>
            </div>

            {/* Message */}
            <h3 className="text-xl font-bold text-pw-violet mb-4 text-center px-4 animate-pulse">
                {message}
            </h3>

            {/* Fun Fact Card */}
            <div className="h-24 w-full max-w-md px-4 relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={factIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white p-4 rounded-xl shadow-sm border border-pw-border text-center"
                    >
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <FaLightbulb className="text-yellow-500 text-xs" />
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Did You Know?</span>
                        </div>
                        <p className="text-gray-600 font-medium text-sm leading-relaxed">
                            {FUN_FACTS[factIndex]}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
