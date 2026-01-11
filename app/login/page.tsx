'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/context/LanguageContext'
import { FaEye, FaEyeSlash, FaGoogle, FaEnvelope, FaLanguage } from 'react-icons/fa'
import { HiArrowLeft } from 'react-icons/hi'
import { MdLock } from 'react-icons/md'

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const { loginWithEmail, signInWithGoogle } = useAuth()
    const { t, language, setLanguage } = useLanguage()
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            await loginWithEmail(email, password)
            router.push('/onboarding')
        } catch (err: any) {
            console.error(err)
            // Show detailed error for debugging
            const errorMessage = err.code ? `Error: ${err.code}` : err.message || 'Login failed'
            setError(errorMessage)
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        try {
            await signInWithGoogle()
            router.push('/onboarding')
        } catch (err: any) {
            console.error(err)
            const errorMessage = err.code ? `Error: ${err.code}` : err.message || 'Google sign in failed'
            setError(errorMessage)
        }
    }

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'hi' : 'en')
    }

    return (
        <div className="min-h-screen bg-pw-surface text-pw-violet flex flex-col p-6 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-pw-indigo border border-pw-border shadow-pw-sm hover:bg-pw-surface transition-all">
                    <HiArrowLeft className="text-xl" />
                </Link>
                <button
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-pw-indigo text-sm font-bold border border-pw-border shadow-pw-sm hover:bg-pw-surface transition-all"
                >
                    <FaLanguage className="text-lg" />
                    <span>{language === 'en' ? 'Hi / En' : 'En / Hi'}</span>
                </button>
            </div>

            <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-center">
                {/* Hero Illustration */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    suppressHydrationWarning
                    className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden mb-8 shadow-pw-xl border border-pw-border bg-white"
                >
                    <Image
                        src="/assets/login-hero.png"
                        alt="Students studying"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute bottom-4 left-4">
                        <span className="inline-block bg-white/90 backdrop-blur-md text-pw-indigo text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm border border-pw-indigo/10">
                            Top Choice
                        </span>
                    </div>
                </motion.div>

                {/* Welcome Text */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8 text-center md:text-left"
                >
                    <h1 className="text-4xl font-display font-black mb-2 text-pw-violet leading-tight">
                        {t('auth.welcomeBack')} <span className="text-pw-indigo underline decoration-pw-lavender decoration-4 underline-offset-4">{t('auth.topper')}</span>
                    </h1>
                    <p className="text-gray-500 font-medium">
                        {t('auth.loginSubtitle')}
                    </p>
                </motion.div>

                {/* Login Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-6 md:p-8 rounded-[2rem] shadow-pw-xl border border-pw-border"
                >
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-pw-violet mb-2 ml-1">{t('auth.mobileEmailLabel')}</label>
                                <Input
                                    placeholder={language === 'en' ? "Enter your phone or email" : "अपना फोन या ईमेल दर्ज करें"}
                                    icon={<FaEnvelope className="text-pw-indigo/60" />}
                                    className="!bg-pw-surface !border-pw-border !text-pw-violet placeholder:!text-gray-400 rounded-xl focus:!border-pw-indigo focus:!ring-pw-indigo/20 transition-all font-medium"
                                    style={{
                                        backgroundColor: '#F8F9FC',
                                        borderColor: '#E5E7EB',
                                        color: '#140D52',
                                        height: '56px'
                                    }}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-pw-violet mb-2 ml-1">{t('auth.passwordLabel')}</label>
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={language === 'en' ? "Enter your password" : "अपना पासवर्ड दर्ज करें"}
                                    icon={<MdLock className="text-pw-indigo/60 text-lg" />}
                                    rightIcon={showPassword ? <FaEyeSlash className="text-gray-400 hover:text-pw-indigo" /> : <FaEye className="text-gray-400 hover:text-pw-indigo" />}
                                    onRightIconClick={() => setShowPassword(!showPassword)}
                                    className="!bg-pw-surface !border-pw-border !text-pw-violet placeholder:!text-gray-400 rounded-xl focus:!border-pw-indigo focus:!ring-pw-indigo/20 transition-all font-medium"
                                    style={{
                                        backgroundColor: '#F8F9FC',
                                        borderColor: '#E5E7EB',
                                        color: '#140D52',
                                        height: '56px'
                                    }}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm font-bold text-center bg-red-50 py-2 rounded-lg border border-red-100">{error}</p>}

                        <div className="flex justify-end">
                            <Link href="#" className="text-sm text-pw-indigo font-bold hover:text-pw-violet transition-colors">
                                {t('auth.forgotPassword')}
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            loading={loading}
                            className="bg-gradient-to-r from-pw-indigo to-pw-violet hover:shadow-pw-lg text-white rounded-xl h-14 text-lg font-bold shadow-pw-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {t('auth.login')} <span className="ml-2">→</span>
                        </Button>

                        <div className="relative py-4 flex items-center justify-center gap-4">
                            <div className="h-[1px] bg-pw-border flex-1"></div>
                            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{t('auth.continueWith')}</span>
                            <div className="h-[1px] bg-pw-border flex-1"></div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-pw-border text-pw-violet font-bold hover:bg-pw-surface hover:border-pw-indigo/30 transition-all h-14 shadow-pw-sm"
                            >
                                <FaGoogle className="text-lg text-red-500" /> Continue with Google
                            </button>
                        </div>
                    </form>
                </motion.div>

                <p className="text-center mt-8 text-gray-500 font-medium">
                    {t('auth.newHere')} <Link href="/signup" className="text-pw-indigo font-bold hover:text-pw-violet transition-colors ml-1 hover:underline">{t('auth.createAccount')} ↗</Link>
                </p>
            </div>
        </div>
    )
}
