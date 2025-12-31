'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { FaGraduationCap, FaMedal, FaRocket, FaUserGraduate, FaLightbulb } from 'react-icons/fa'
import { HiArrowRight } from 'react-icons/hi'
import { TbSum } from 'react-icons/tb'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'

export default function LandingPage() {
    const { t, language, setLanguage } = useLanguage()
    const { user } = useAuth()
    const router = useRouter()

    return (
        <div className="min-h-screen relative overflow-hidden bg-surface-off flex flex-col">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[url('/assets/grid-pattern.svg')] opacity-5 pointer-events-none" style={{ backgroundSize: '40px 40px' }}></div>

            {/* Header */}
            <header className="relative z-10 w-full px-6 py-4 flex justify-between items-center max-w-md mx-auto w-full">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center shadow-lg transform rotate-3">
                        <FaGraduationCap className="text-white text-xl" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold text-[#110c1d] leading-none">AIM</h1>
                        <span className="text-[10px] tracking-[0.2em] text-[#8b5cf6] font-bold uppercase">Academy</span>
                    </div>
                </div>

                <div className="bg-white rounded-full p-1 shadow-sm border border-gray-100 flex items-center">
                    <button
                        onClick={() => setLanguage('hi')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${language === 'hi' ? 'bg-[#110c1d] text-white' : 'text-gray-500 hover:text-[#110c1d]'}`}
                    >
                        हिंदी
                    </button>
                    <button
                        onClick={() => setLanguage('en')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${language === 'en' ? 'bg-[#110c1d] text-white' : 'text-gray-500 hover:text-[#110c1d]'}`}
                    >
                        Eng
                    </button>
                </div>
            </header>

            <main className="relative flex-1 px-6 pb-8 flex flex-col items-center max-w-md mx-auto w-full">

                {/* Hero Card */}
                <div className="relative w-full aspect-[4/3] mt-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
                    >
                        <Image
                            src="/assets/login-hero.png"
                            alt="Students studying"
                            fill
                            className="object-cover"
                            priority
                        />

                        {/* Live Now Badge */}
                        <div className="absolute top-4 right-4 bg-[#ef4444] text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            {t('welcome.liveNow')}
                        </div>

                        {/* Cursive Text Overlay */}
                        <div className="absolute top-4 left-4">
                            <span className="font-handwriting text-white/90 text-xl font-medium tracking-wide" style={{ fontFamily: 'cursive' }}>{t('welcome.feeling')}</span>
                        </div>
                    </motion.div>

                    {/* Floating Icons */}
                    <motion.div
                        animate={{ y: [0, -10, 0], rotate: [-5, 5, -5] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/2 -left-4 -translate-y-1/2 w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center transform -rotate-12 z-20"
                    >
                        <TbSum className="text-3xl text-[#8b5cf6]" />
                    </motion.div>

                    <motion.div
                        animate={{ y: [0, 10, 0], rotate: [5, -5, 5] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute -top-6 -right-4 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center z-20"
                    >
                        <div className="w-10 h-10 rounded-full bg-[#fcd34d] flex items-center justify-center">
                            <FaLightbulb className="text-xl text-[#b45309]" />
                        </div>
                    </motion.div>
                </div>

                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center w-full"
                >
                    <h2 className="text-4xl font-bold text-[#110c1d] mb-1">
                        {t('welcome.titlePrefix')}
                    </h2>
                    <h2 className="text-5xl font-extrabold text-[#8b5cf6] mb-3 tracking-tight">
                        AIM
                    </h2>
                    <p className="text-[#64748b] text-lg font-medium mb-6">
                        {t('welcome.subtitle')}
                    </p>

                    {/* Tagline Pill */}
                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white shadow-sm border border-gray-100 mb-8 mx-auto">
                        <div className="w-5 h-5 rounded-full bg-[#8b5cf6] flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-white" stroke="currentColor" strokeWidth="3">
                                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="font-bold text-[#110c1d]">{t('welcome.tagline')}</span>
                    </div>

                    {/* CTA Button */}
                    <div className="block w-full mb-8">
                        <button
                            onClick={() => {
                                // If on landing, button should probably just go home or login.
                                // Since this page is now /landing, going to /play/mode is wrong if that path is gone.
                                // Assuming it should go to Main App (Home) or Login.
                                if (user) {
                                    router.push('/')
                                } else {
                                    router.push('/login')
                                }
                            }}
                            className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xl py-4 rounded-2xl shadow-lg shadow-purple-200 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                            {t('welcome.cta')} <HiArrowRight className="text-2xl" />
                        </button>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-[#f3e8ff] flex items-center justify-center">
                                <FaUserGraduate className="text-[#7c3aed] text-lg" />
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('welcome.board.label')}</span>
                            <span className="font-bold text-[#110c1d]">{t('welcome.board.value')}</span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-[#fff7ed] flex items-center justify-center">
                                <FaMedal className="text-[#f59e0b] text-lg" />
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('welcome.content.label')}</span>
                            <span className="font-bold text-[#110c1d]">{t('welcome.content.value')}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-gray-500 font-medium pb-4">
                        {t('welcome.newHere')} <Link href="/signup" className="text-[#8b5cf6] font-bold hover:underline">{t('welcome.createAccount')}</Link>
                    </div>

                </motion.div>

            </main>
        </div>
    )
}
