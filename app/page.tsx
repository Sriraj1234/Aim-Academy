'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { FaGraduationCap, FaMedal, FaRocket, FaUserGraduate, FaLightbulb, FaBrain, FaUsers } from 'react-icons/fa'
import { HiArrowRight } from 'react-icons/hi'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Footer } from '@/components/shared/Footer'

export default function LandingPage() {
  const { t, language, setLanguage } = useLanguage()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Smart Redirect Logic
  useEffect(() => {
    if (!loading && user) {
      setIsRedirecting(true)
      router.push('/home')
    }
  }, [user, loading, router])

  // 1. SHOW LOADING SCREEN (For Logged In Users)
  // While checking auth OR if redirecting, show a blank/loading screen.
  // This creates the illusion of "Direct Home" for existing users.
  if (loading || (user && isRedirecting)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pw-surface">
        <div className="w-16 h-16 border-4 border-pw-indigo border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-pw-indigo font-bold animate-pulse">Opening Padhaku...</p>
      </div>
    )
  }

  // 2. SHOW LANDING PAGE (For Google Bot & New Users)
  return (
    <div className="min-h-screen relative overflow-x-hidden bg-surface-off flex flex-col font-sans">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[url('/assets/grid-pattern.svg')] opacity-5 pointer-events-none" style={{ backgroundSize: '40px 40px' }}></div>

      {/* Header */}
      <header className="relative z-10 w-full px-4 sm:px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center shadow-lg transform rotate-3">
            <FaGraduationCap className="text-white text-xl" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[#110c1d] leading-none">Padhaku</h1>
            <span className="text-[10px] tracking-[0.2em] text-[#8b5cf6] font-bold uppercase">Learning App</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
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
          <Link href="/login" className="hidden sm:block px-5 py-2 rounded-full bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
            Login
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full">

        {/* HERO SECTION */}
        <section className="relative px-6 pb-12 pt-8 flex flex-col items-center max-w-4xl mx-auto w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-4xl md:text-6xl font-black text-[#110c1d] mb-2 tracking-tight">
              {t('welcome.titlePrefix')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Padhaku</span>
            </h2>
            <p className="text-[#64748b] text-lg md:text-xl font-medium max-w-2xl mx-auto mb-8">
              Master Bihar Board exams with interactive quizzes, detailed explanations, and live competitive battles.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/home">
                <button
                  className="w-full sm:w-auto px-8 py-4 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-lg rounded-2xl shadow-lg shadow-purple-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  Start Learning Free <HiArrowRight />
                </button>
              </Link>
              <Link href="/about">
                <button className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-bold text-lg rounded-2xl border border-gray-200 transition-all">
                  Learn More
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative w-full aspect-video md:aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-gray-100"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 z-10"></div>
            <Image
              src="/assets/login-hero.png"
              alt="Students studying happy"
              fill
              className="object-cover"
              priority
            />
            {/* Floating Stats */}
            <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xl">
                <FaUserGraduate />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-gray-500 uppercase">Trusted By</p>
                <p className="text-lg font-black text-gray-900">10,000+ Students</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* STATS SECTION (High Value Content) */}
        <section className="py-20 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatCard icon={FaUsers} value="10k+" label="Active Learners" color="text-blue-600" bg="bg-blue-50" />
              <StatCard icon={FaGraduationCap} value="500+" label="Toppers Created" color="text-purple-600" bg="bg-purple-50" />
              <StatCard icon={FaBrain} value="1M+" label="Questions Solved" color="text-pink-600" bg="bg-pink-50" />
              <StatCard icon={FaRocket} value="24/7" label="AI Support" color="text-orange-600" bg="bg-orange-50" />
            </div>
          </div>
        </section>

        {/* VALUES / CONTENT SECTION (AdSense Friendly) */}
        <section className="py-24 bg-surface-off">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-[#110c1d] mb-4">Why Choose Padhaku?</h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                We combine cutting-edge technology with the Bihar Board curriculum to create a learning experience that works.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                title="Personalized AI Learning"
                desc="Our AI adapts to your learning style, identifying weak areas and providing targeted practice questions to improve your score rapidly."
                icon={<FaBrain />}
              />
              <FeatureCard
                title="Gamified Practice"
                desc="Study doesn't have to be boring. Earn XP, climb leaderboards, and challenge friends in live quizzes to make learning addictive."
                icon={<FaMedal />}
              />
              <FeatureCard
                title="Comprehensive Syllabus"
                desc="From Math to Hindi, we cover every chapter of the Bihar Board Class 10 & 12 syllabus with detailed notes and video resources."
                icon={<FaGraduationCap />}
              />
            </div>
          </div>
        </section>

        {/* SEO Text Block (Crucial for AdSense) */}
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">About Padhaku - Bihar's Best Learning App</h2>
            <div className="prose prose-lg text-gray-600 mx-auto">
              <p className="mb-4">
                Padhaku is an initiative to revolutionize education in Bihar. We believe that every student deserves access to world-class educational tools, regardless of their location.
              </p>
              <p>
                Unlike traditional coaching, Padhaku travels with you. Whether you are on the bus or at home, your study materials, practice tests, and performance analytics are just a tap away. Join thousands of students who are changing their future with Padhaku.
              </p>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}

// Components
const StatCard = ({ icon: Icon, value, label, color, bg }: any) => (
  <div className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors">
    <div className={`w-14 h-14 ${bg} ${color} rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4`}>
      <Icon />
    </div>
    <div className="text-3xl font-black text-gray-900 mb-1">{value}</div>
    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{label}</div>
  </div>
);

const FeatureCard = ({ title, desc, icon }: any) => (
  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed text-sm">
      {desc}
    </p>
  </div>
);
