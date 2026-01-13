'use client';

import { AIQuestionGenerator } from './AIQuestionGenerator';
import { AIFlashcardGenerator } from './AIFlashcardGenerator';
import { ChapterSummary } from './ChapterSummary';
import { motion } from 'framer-motion';
import { FaRobot, FaBolt } from 'react-icons/fa';

export const AIStudyToolsGrid = () => {
    return (
        <div className="relative">
            {/* Header Section */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                        <span className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/20 shrink-0">
                            <FaRobot className="text-white" />
                        </span>
                        AI Study Power Tools
                    </h3>
                    <p className="text-white/40 text-sm mt-1 ml-11">
                        Supercharge your learning with Generative AI
                    </p>
                </div>
                <div className="self-start md:self-center flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-300">
                    <FaBolt className="text-yellow-400" />
                    <span>Powered by Llama-3 70B</span>
                </div>
            </div>

            {/* Premium Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Practice Questions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="h-full"
                >
                    <AIQuestionGenerator />
                </motion.div>

                {/* 2. Flashcards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="h-full"
                >
                    <AIFlashcardGenerator />
                </motion.div>

                {/* 3. Summarizer (Notes) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="h-full"
                >
                    <ChapterSummary />
                </motion.div>
            </div>
        </div>
    );
};
