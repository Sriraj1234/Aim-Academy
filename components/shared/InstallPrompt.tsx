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
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-pw-violet text-white p-4 rounded-2xl shadow-pw-xl z-50 border border-white/10 flex items-center gap-4"
                >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-pw-violet text-2xl shadow-sm shrink-0">
                        <img src="/padhaku-192.png" alt="App" className="w-full h-full rounded-xl object-cover" />
                    </div>

                    <div className="flex-1">
                        <h4 className="font-bold text-sm">Install Padhaku App</h4>
                        <p className="text-xs text-pw-lavender/80">Get the best experience with full screen & offline access.</p>
                    </div>

                    {isIOS ? (
                        <button onClick={() => setShowPrompt(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                            <FaTimes />
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={handleInstallClick}
                                className="bg-white text-pw-violet px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-gray-100 transition-colors"
                            >
                                Install
                            </button>
                            <button onClick={() => setShowPrompt(false)} className="p-2 text-white/50 hover:text-white transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
