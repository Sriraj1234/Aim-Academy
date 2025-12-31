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
import { FaEye, FaEyeSlash, FaGoogle, FaEnvelope, FaUser, FaLanguage } from 'react-icons/fa'
import { MdLock } from 'react-icons/md'

export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')

    const { signupWithEmail, signInWithGoogle } = useAuth()
    const { t, language, setLanguage } = useLanguage()
    const router = useRouter()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (password !== confirmPassword) {
            setError(language === 'en' ? 'Passwords do not match' : 'पासवर्ड मेल नहीं खाते')
            setLoading(false)
            return
        }

        try {
            await signupWithEmail(email, password)
            router.push('/onboarding')
        } catch (err: any) {
            console.error(err)
            const errorMessage = err.code ? `Error: ${err.code}` : err.message || 'Signup failed'
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
        <div className="min-h-screen bg-pw-surface text-gray-900 flex flex-col p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <Link href="/" className="flex items-center gap-2">
                    {/* Brand Logo or Text could go here, for now using simple back */}
                    <span className="font-display font-bold text-2xl text-pw-violet">AIM <span className="text-pw-indigo">Academy</span></span>
                </Link>
                <button
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-pw-border text-pw-indigo font-medium shadow-sm hover:shadow-md transition-all"
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
                    className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden mb-8 shadow-pw-lg border border-pw-border bg-white"
                >
                    <Image
                        src="/assets/login-hero.png"
                        alt="Students studying"
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-700"
                        priority
                    />
                    <div className="absolute bottom-4 left-4">
                        <span className="inline-block bg-white/90 backdrop-blur-md text-pw-indigo border border-pw-indigo/20 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                            {t('auth.joinUs')}
                        </span>
                    </div>
                </motion.div>

                {/* Welcome Text */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold mb-2 text-pw-violet">
                        {t('auth.createAccountTitle')}<span className="text-pw-indigo">.</span>
                    </h1>
                    <p className="text-gray-500">
                        {t('auth.createAccountSubtitle')}
                    </p>
                </motion.div>

                {/* Signup Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-3xl shadow-pw-lg border border-pw-border"
                >
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">{t('auth.fullNameLabel')}</label>
                                <Input
                                    placeholder={language === 'en' ? "Enter your full name" : "अपना पूरा नाम दर्ज करें"}
                                    icon={<FaUser className="text-gray-400" />}
                                    className="!bg-pw-surface !border-pw-border !text-gray-900 placeholder:!text-gray-400 rounded-xl focus:!border-pw-indigo focus:!ring-pw-indigo/20"
                                    style={{ height: '52px' }}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">{t('auth.mobileEmailLabel')}</label>
                                <Input
                                    placeholder={language === 'en' ? "Enter your phone or email" : "अपना फोन या ईमेल दर्ज करें"}
                                    icon={<FaEnvelope className="text-gray-400" />}
                                    className="!bg-pw-surface !border-pw-border !text-gray-900 placeholder:!text-gray-400 rounded-xl focus:!border-pw-indigo focus:!ring-pw-indigo/20"
                                    style={{ height: '52px' }}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">{t('auth.passwordLabel')}</label>
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={language === 'en' ? "Create a password" : "पासवर्ड बनाएं"}
                                    icon={<MdLock className="text-gray-400 text-lg" />}
                                    rightIcon={showPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                                    onRightIconClick={() => setShowPassword(!showPassword)}
                                    className="!bg-pw-surface !border-pw-border !text-gray-900 placeholder:!text-gray-400 rounded-xl focus:!border-pw-indigo focus:!ring-pw-indigo/20"
                                    style={{ height: '52px' }}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">{t('auth.confirmPasswordLabel')}</label>
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={language === 'en' ? "Confirm your password" : "पासवर्ड की पुष्टि करें"}
                                    icon={<MdLock className="text-gray-400 text-lg" />}
                                    className="!bg-pw-surface !border-pw-border !text-gray-900 placeholder:!text-gray-400 rounded-xl focus:!border-pw-indigo focus:!ring-pw-indigo/20"
                                    style={{ height: '52px' }}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>}

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            loading={loading}
                            className="bg-gradient-to-r from-pw-indigo to-pw-violet hover:shadow-pw-lg text-white rounded-xl h-12 text-lg font-bold shadow-pw-md transition-all mt-2"
                        >
                            {t('auth.createAccount')} <span className="ml-2">→</span>
                        </Button>

                        <div className="relative py-4 flex items-center justify-center gap-4">
                            <div className="h-[1px] bg-gray-200 flex-1"></div>
                            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{t('auth.continueWith')}</span>
                            <div className="h-[1px] bg-gray-200 flex-1"></div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 hover:border-pw-indigo/30 hover:text-pw-indigo transition-all h-12 shadow-sm"
                            >
                                <FaGoogle className="text-lg text-red-500" /> Continue with Google
                            </button>
                        </div>
                    </form>
                </motion.div>

                <p className="text-center mt-8 text-gray-500 font-medium">
                    {t('auth.alreadyAccount')} <Link href="/login" className="text-pw-indigo font-bold hover:text-pw-violet transition-colors ml-1">{t('auth.login')}</Link>
                </p>
            </div>
        </div>
    )
}
