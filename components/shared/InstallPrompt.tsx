'use client'
import { useState, useEffect } from 'react'
import { FaDownload, FaTimes } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'

export const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [showPrompt, setShowPrompt] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const { user } = useAuth()

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return;
        }

        // Android / Desktop Chrome
        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            // Show prompt only if user is logged in, to be polite/relevant
            if (user) {
                setShowPrompt(true)
            }
        }

        window.addEventListener('beforeinstallprompt', handler)

        // iOS Detection
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        if (isIosDevice) {
            setIsIOS(true)
            // Show for iOS users too after some time
            if (user) {
                setTimeout(() => setShowPrompt(true), 3000);
            }
        }

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [user])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            setDeferredPrompt(null)
            setShowPrompt(false)
        }
    }

    if (!showPrompt) return null

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ y: 100, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 100, opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-[26rem] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 p-5 rounded-[2rem] shadow-2xl z-[100] overflow-hidden"
                >
                    {/* Ambient Glow */}
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-pw-indigo/20 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-pw-violet/20 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative flex items-start gap-4">
                        <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg border border-white/20 dark:border-slate-600 shrink-0 overflow-hidden">
                            <img src="/padhaku-192.png" alt="Padhaku" className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1 min-w-0 pt-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-display font-bold text-lg text-pw-violet dark:text-white leading-none">Padhaku App</h4>
                                <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border border-yellow-200 dark:border-yellow-700/50">
                                    ★ 4.9
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-slate-300 leading-snug">
                                {isIOS ? 'Install for full-screen experience & offline access.' : 'Install our app for the best experience!'}
                            </p>

                            {/* iOS Instructions */}
                            {isIOS && (
                                <div className="mt-3 bg-pw-surface dark:bg-slate-800 p-3 rounded-xl border border-pw-border dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400">
                                    <div className="flex items-center gap-2 mb-1.5 font-bold text-pw-indigo dark:text-sky-400">
                                        <span>Tap</span>
                                        <span className="px-2 py-1 bg-white dark:bg-slate-700 rounded-md shadow-sm border border-gray-100 dark:border-slate-600 inline-flex items-center justify-center">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                                        </span>
                                        <span>then &quot;Add to Home Screen&quot;</span>
                                    </div>
                                    <div className="flex items-center gap-2 font-bold text-pw-indigo dark:text-sky-400">
                                        <span>Scroll down & click</span>
                                        <span className="px-2 py-1 bg-white dark:bg-slate-700 rounded-md shadow-sm border border-gray-100 dark:border-slate-600 inline-flex items-center justify-center">
                                            <span className="text-lg leading-none">+</span>
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Android/Desktop Actions */}
                            {!isIOS && (
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={handleInstallClick}
                                        className="flex-1 bg-gradient-to-r from-pw-indigo to-pw-violet text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-pw-md hover:shadow-pw-lg active:scale-95 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <FaDownload className="text-xs group-hover:-translate-y-0.5 transition-transform" />
                                        Install Now
                                    </button>
                                    <button
                                        onClick={() => setShowPrompt(false)}
                                        className="px-4 py-2.5 text-sm font-bold text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                    >
                                        Later
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Close Toggle (Top Right) */}
                        <button
                            onClick={() => setShowPrompt(false)}
                            className="absolute -top-1 -right-1 p-2 text-gray-400 hover:text-pw-violet dark:hover:text-white transition-colors"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
