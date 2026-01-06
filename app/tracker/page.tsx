'use client';

import { SyllabusBoard } from '@/components/tracker/SyllabusBoard';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { motion } from 'framer-motion';

export default function TrackerPage() {
    return (
        <div className="min-h-screen bg-pw-surface pb-20 font-sans">
            <Header />

            <main className="pt-24 pb-12 px-4 max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <SyllabusBoard />
                </motion.div>
            </main>

            <Footer />
        </div>
    );
}
