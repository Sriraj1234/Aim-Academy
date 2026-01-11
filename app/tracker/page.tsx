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

                {/* SEO / Content Section */}
                <div className="mt-12 border-t border-gray-200 pt-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Mastering the Bihar Board Syllabus</h2>
                    <div className="prose prose-indigo max-w-none text-gray-600">
                        <p>
                            A structured approach to the syllabus is the key to scoring 90%+ in Bihar Board exams.
                            The Class 10th and 12th syllabus is vast, covering Math, Science, Social Studies, and Languages.
                            Effective tracking ensures you don't miss high-weightage chapters.
                        </p>
                        <div className="grid md:grid-cols-3 gap-6 mt-6">
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <h3 className="font-bold text-gray-800 mb-2">📅 Consistency</h3>
                                <p className="text-sm">Small daily progress compounds over time. Use this tracker to maintain a streak.</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <h3 className="font-bold text-gray-800 mb-2">⚖️ Balance</h3>
                                <p className="text-sm">Don't ignore easy subjects. Languages like Hindi and English are scoring subjects.</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <h3 className="font-bold text-gray-800 mb-2">🎯 Revision</h3>
                                <p className="text-sm">Marking a chapter as "Done" is just step one. Schedule revisions every 2 weeks.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
