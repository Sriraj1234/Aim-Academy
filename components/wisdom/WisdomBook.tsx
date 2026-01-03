'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WisdomShlok } from '@/types/wisdom';
import { BookPageContent } from './BookPageContent';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface WisdomBookProps {
    shloks: WisdomShlok[];
}

export const WisdomBook: React.FC<WisdomBookProps> = ({ shloks }) => {
    const [pageIndex, setPageIndex] = useState(0); // Index of the CURRENTLY VIEWED shlok
    const [isFlipped, setIsFlipped] = useState(false); // Valid for mobile mostly or flip animation state
    const [audioPlaying, setAudioPlaying] = useState(false);

    // Ensure we have data
    // Ensure we have data
    if (!shloks || shloks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px] text-amber-100/70 text-center px-4">
                <div className="text-4xl mb-4 opacity-50">📖</div>
                <h3 className="text-xl font-serif mb-2">The pages are silent...</h3>
                <p className="text-sm max-w-md mx-auto">It seems we couldn't retrieve the ancient wisdom right now. Please check your connection or try again later.</p>
            </div>
        );
    }

    // Safety check
    const currentShlok = shloks[pageIndex] || shloks[0];
    const isFirst = pageIndex === 0;
    const isLast = pageIndex === shloks.length - 1;

    const nextPage = () => {
        if (!isLast) {
            setPageIndex(prev => prev + 1);
            setAudioPlaying(false);
        }
    };

    const prevPage = () => {
        if (!isFirst) {
            setPageIndex(prev => prev - 1);
            setAudioPlaying(false);
        }
    };

    const toggleAudio = () => {
        setAudioPlaying(!audioPlaying);
        // Implement actual audio logic here later
    };

    return (
        <div className="relative w-full max-w-6xl mx-auto h-[600px] md:h-[700px] perspective-1000 flex items-center justify-center">

            {/* Book Spine (Visual) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-[95%] bg-[#4a3b32] rounded-sm shadow-xl z-0 hidden md:block"></div>

            {/* Book Container */}
            <motion.div
                className="relative w-full h-full flex items-center justify-center md:gap-0 px-4 md:px-0"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                {/* Desktop: 2 Page Spread */}
                <div className="hidden md:flex w-full h-[85%] max-w-4xl bg-[#fdfbf7] rounded-lg shadow-2xl overflow-hidden relative border border-[#e0d6c8] perspective-2000">
                    {/* Left Page (Static) */}
                    <div className="w-1/2 h-full border-r border-[#e5e5e5] relative z-10 bg-gradient-to-br from-[#fdfbf7] to-[#f2e8c9] overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`left-${pageIndex}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.4 }}
                                className="h-full w-full"
                            >
                                <BookPageContent
                                    shlok={currentShlok}
                                    side="left"
                                    isPlaying={false}
                                    onPlayToggle={() => { }}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Right Page (Static) */}
                    <div className="w-1/2 h-full relative z-10 bg-gradient-to-bl from-[#fdfbf7] to-[#f2e8c9] overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`right-${pageIndex}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.4 }}
                                className="h-full w-full"
                            >
                                <BookPageContent
                                    shlok={currentShlok}
                                    side="right"
                                    isPlaying={audioPlaying}
                                    onPlayToggle={toggleAudio}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Book Cover Edge Visuals */}
                    <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-r from-gray-300 to-transparent opacity-30 z-20 pointer-events-none"></div>
                    <div className="absolute top-0 bottom-0 right-0 w-2 bg-gradient-to-l from-gray-300 to-transparent opacity-30 z-20 pointer-events-none"></div>
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-transparent via-gray-400 to-transparent opacity-10 z-20 pointer-events-none"></div>
                </div>

                {/* Mobile: 3D Flip Card */}
                <div className="md:hidden w-full h-[80vh] relative perspective-1000">
                    <motion.div
                        className="w-full h-full relative preserve-3d"
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* Front Face (Verse) */}
                        <div
                            className="absolute inset-0 w-full h-full bg-[#fdfbf7] rounded-xl shadow-xl border border-[#e0d6c8] overflow-hidden backface-hidden"
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            <BookPageContent
                                shlok={currentShlok}
                                side="left"
                                isPlaying={audioPlaying}
                                onPlayToggle={toggleAudio}
                            />
                            {/* Flip overlay button position adjustment needed inside content or overlay here */}
                        </div>

                        {/* Back Face (Meaning) */}
                        <div
                            className="absolute inset-0 w-full h-full bg-[#fdfbf7] rounded-xl shadow-xl border border-[#e0d6c8] overflow-hidden backface-hidden"
                            style={{
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)'
                            }}
                        >
                            <BookPageContent
                                shlok={currentShlok}
                                side="right"
                                isPlaying={audioPlaying}
                                onPlayToggle={toggleAudio}
                            />
                        </div>
                    </motion.div>

                    {/* Mobile Flip Button (Bottom - Outside transform) */}
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center pb-safe z-50 pointer-events-none">
                        <button
                            onClick={() => setIsFlipped(!isFlipped)}
                            className="pointer-events-auto bg-amber-900/90 text-amber-50 backdrop-blur-md px-6 py-3 rounded-full text-xs font-bold shadow-lg border border-amber-500/30 tracking-widest uppercase hover:scale-105 active:scale-95 transition-all"
                        >
                            {isFlipped ? 'Show Verse' : 'Reveal Wisdom'}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Navigation Buttons (Outside Book) */}
            <div className="absolute bottom-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2 left-4 md:-left-12 z-50">
                <button
                    onClick={prevPage}
                    disabled={isFirst}
                    className="p-3 md:p-4 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <FaChevronLeft className="text-xl md:text-2xl" />
                </button>
            </div>

            <div className="absolute bottom-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2 right-4 md:-right-12 z-50">
                <button
                    onClick={nextPage}
                    disabled={isLast}
                    className="p-3 md:p-4 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <FaChevronRight className="text-xl md:text-2xl" />
                </button>
            </div>

        </div>
    );
};
