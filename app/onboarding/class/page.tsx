'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { Button } from '@/components/shared/Button'
import { FaGraduationCap, FaInfoCircle } from 'react-icons/fa'

export default function ClassSelectionPage() {
    return (
        <div className="min-h-screen bg-surface-off p-4 flex flex-col items-center">
            <div className="w-full max-w-md pt-8">
                <ProgressBar currentStep={1} totalSteps={3} />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-3xl font-display font-bold text-text-main mb-2">
                        Which class are <br />
                        you in? 📚
                    </h1>
                    <p className="text-text-sub">We'll customize the syllabus for you.</p>
                </motion.div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Class 10 Option */}
                    <Link href="/">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            whileHover={{ scale: 1.05 }}
                            className="relative p-6 rounded-2xl bg-white border-2 border-brand-500 shadow-soft cursor-pointer h-full flex flex-col items-center justify-center text-center group"
                        >
                            <div className="w-20 h-20 mb-4 rounded-full bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                                <FaGraduationCap className="text-4xl text-brand-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-text-main mb-1">Class 10</h3>
                            <p className="text-xs text-text-sub font-medium">Metric Exam</p>

                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wide whitespace-nowrap">
                                Board Year
                            </div>
                        </motion.div>
                    </Link>

                    {/* Class 9 Option */}
                    <Link href="/">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            whileHover={{ scale: 1.05 }}
                            className="relative p-6 rounded-2xl bg-white border-2 border-transparent hover:border-brand-200 shadow-card hover:shadow-soft cursor-pointer h-full flex flex-col items-center justify-center text-center"
                        >
                            <div className="w-20 h-20 mb-4 rounded-full bg-slate-50 flex items-center justify-center">
                                <span className="text-4xl font-bold text-slate-300">9</span>
                            </div>
                            <h3 className="text-2xl font-bold text-text-muted mb-1">Class 9</h3>
                            <p className="text-xs text-text-sub font-medium">Foundation</p>
                        </motion.div>
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8 bg-blue-50 p-4 rounded-xl flex gap-3 text-blue-700 text-sm"
                >
                    <FaInfoCircle className="text-xl flex-shrink-0" />
                    <p>Don't worry, you can always change your class later from the profile settings.</p>
                </motion.div>
            </div>
        </div>
    )
}
