'use client';

import React, { useEffect, useState } from 'react';
import { WisdomBook } from '@/components/wisdom/WisdomBook';
import { WisdomShlok } from '@/types/wisdom';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function WisdomPage() {
    const [shloks, setShloks] = useState<WisdomShlok[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShloks = async () => {
            try {
                const res = await fetch('/api/wisdom');
                const data = await res.json();
                setShloks(data);
            } catch (error) {
                console.error("Failed to fetch wisdom content", error);
            } finally {
                setLoading(false);
            }
        };

        fetchShloks();
    }, []);

    return (
        <div className="min-h-screen bg-[#1a0b05] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#2c1810] to-[#1a0b05] text-white overflow-hidden relative">

            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-900/20 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Header / Nav */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-50">
                <Link href="/home" className="flex items-center gap-2 text-amber-100/60 hover:text-amber-100 transition-colors group">
                    <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                        <FaArrowLeft />
                    </div>
                    <span className="font-medium tracking-wide text-sm hidden sm:block">Back to Study</span>
                </Link>

                <div className="text-center">
                    <h1 className="font-serif text-xl sm:text-2xl text-amber-100/90 tracking-widest uppercase opacity-80">
                        The Wisdom Book
                    </h1>
                    <p className="text-[10px] sm:text-xs text-amber-200/50 uppercase tracking-[0.2em] mt-1">
                        Timeless Guidance
                    </p>
                </div>

                <div className="w-24"></div> {/* Spacer for center alignment */}
            </div>

            {/* Main Content */}
            <main className="flex items-center justify-center min-h-screen p-4 pt-20">
                {loading ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                        <p className="text-amber-200/50 text-sm tracking-widest animate-pulse">Opening the Manuscript...</p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                        className="w-full"
                    >
                        <WisdomBook shloks={shloks} />
                    </motion.div>
                )}
            </main>

            {/* Footer Quote */}
            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                <p className="text-amber-100/20 text-[10px] md:text-xs font-serif italic max-w-md mx-auto px-4">
                    "This section presents selected ancient verses purely for student motivation, discipline, and personal growth."
                </p>
            </div>
        </div>
    );
}
