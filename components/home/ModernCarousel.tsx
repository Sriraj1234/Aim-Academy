'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaArrowRight, FaChevronLeft, FaChevronRight, FaStar, FaCrown, FaBolt, FaUserGraduate } from 'react-icons/fa'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

interface Slide {
    id: number
    type: 'personal' | 'ad'
    title?: string
    subtitle?: string
    description?: string
    ctaText?: string
    ctaLink?: string
    bgClass: string
    icon: React.ElementType
}

const adSlides: Slide[] = [
    {
        id: 2,
        type: 'ad',
        title: "Toppers Batch 2025",
        subtitle: "Admissions Open",
        description: "Join the most elite batch for Class 10th. Live classes, notes, and 24/7 doubt support.",
        ctaText: "Enroll Now",
        ctaLink: "/courses",
        bgClass: "bg-gradient-to-br from-indigo-600 to-violet-700",
        icon: FaCrown
    },
    {
        id: 3,
        type: 'ad',
        title: "Free Mock Tests",
        subtitle: "Win Scholarships",
        description: "Attempt our weekly All India Mock Test and stand a chance to win 100% scholarship.",
        ctaText: "Start Test",
        ctaLink: "/play/selection",
        bgClass: "bg-gradient-to-br from-emerald-500 to-teal-600",
        icon: FaBolt
    },
    {
        id: 4,
        type: 'ad',
        title: "Science 3D Models",
        subtitle: "New Feature",
        description: "Experience Physics and Biology like never before with our interactive 3D modules.",
        ctaText: "Explore Now",
        ctaLink: "/demos",
        bgClass: "bg-gradient-to-br from-orange-500 to-red-600",
        icon: FaStar
    }
]

export const ModernCarousel = () => {
    const { user, userProfile } = useAuth()
    const [current, setCurrent] = useState(0)
    const [isHovered, setIsHovered] = useState(false)

    // Dynamic First Slide Data
    const name = user?.displayName?.split(' ')[0] || userProfile?.displayName?.split(' ')[0] || 'Topper'
    const streak = userProfile?.gamification?.currentStreak || 0

    // Combine Personal Slide + Ads
    const slides: Slide[] = [
        {
            id: 1,
            type: 'personal',
            bgClass: "bg-gradient-to-br from-[#4f46e5] to-[#7c3aed]",
            icon: FaUserGraduate
        },
        ...adSlides
    ]

    // Auto-slide logic
    useEffect(() => {
        if (isHovered) return
        const timer = setInterval(() => {
            setCurrent(prev => (prev + 1) % slides.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [isHovered, slides.length])

    const nextSlide = () => setCurrent(prev => (prev + 1) % slides.length)
    const prevSlide = () => setCurrent(prev => (prev - 1 + slides.length) % slides.length)

    // Helper to render content based on slide type
    const renderContent = (slide: Slide) => {
        if (slide.type === 'personal') {
            return (
                <>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full border border-white/20 mb-4"
                    >
                        <span className="text-amber-300"><FaStar /></span>
                        <span className="text-white text-xs font-bold tracking-wider uppercase">{streak} Day Streak</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-3xl md:text-5xl font-black text-white leading-tight mb-3 drop-shadow-md"
                    >
                        Welcome Back,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-200">{name}!</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-indigo-100 text-base md:text-lg font-medium mb-6 max-w-lg mx-auto md:mx-0 leading-relaxed line-clamp-2 md:line-clamp-none"
                    >
                        Continue your preparation with today's daily challenge and boost your rank!
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Link href="/play/selection">
                            <button className="px-6 py-3 bg-white text-indigo-700 rounded-xl font-bold text-base shadow-lg hover:shadow-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 mx-auto md:mx-0 active:scale-95 group/btn">
                                <span>Continue Practice</span>
                                <FaArrowRight className="group-hover/btn:translate-x-1 transition-transform text-xs" />
                            </button>
                        </Link>
                    </motion.div>
                </>
            )
        }

        // Standard Ad Slide Content
        return (
            <>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-4"
                >
                    <span className="text-white text-xs font-bold tracking-wider uppercase">{slide.subtitle}</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl md:text-5xl font-black text-white leading-tight mb-3 drop-shadow-md"
                >
                    {slide.title}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/90 text-base md:text-lg font-medium mb-6 max-w-lg mx-auto md:mx-0 leading-relaxed line-clamp-2 md:line-clamp-none"
                >
                    {slide.description}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Link href={slide.ctaLink || '/'}>
                        <button className="px-6 py-3 bg-white text-gray-900 rounded-xl font-bold text-base shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2 mx-auto md:mx-0 active:scale-95 group/btn">
                            <span>{slide.ctaText}</span>
                            <FaArrowRight className="group-hover/btn:translate-x-1 transition-transform text-xs" />
                        </button>
                    </Link>
                </motion.div>
            </>
        )
    }

    return (
        <section
            className="w-full max-w-7xl mx-auto mb-8 overflow-hidden font-sans relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Height auto on mobile to fit content, fixed on desktop */}
            <div className="relative min-h-[480px] md:min-h-[400px] md:h-[400px] rounded-[2rem] overflow-hidden shadow-xl group touch-pan-ay">
                <AnimatePresence initial={false} mode='popLayout' custom={0}>
                    <motion.div
                        key={current}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipe = offset.x;

                            if (swipe < -50) {
                                nextSlide();
                            } else if (swipe > 50) {
                                prevSlide();
                            }
                        }}
                        className={`absolute inset-0 ${slides[current].bgClass} p-5 md:p-12 flex flex-col md:flex-row items-center justify-between cursor-grab active:cursor-grabbing`}
                    >
                        {/* Background Decor */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white opacity-10 rounded-full blur-[60px]" />
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-black opacity-10 rounded-full blur-[50px]" />
                        </div>

                        {/* Text Content */}
                        <div className="relative z-10 w-full md:w-3/5 text-center md:text-left mt-2 md:mt-0 px-2 md:px-0">
                            {renderContent(slides[current])}
                        </div>

                        {/* Right Graphic / Icon Area - Adjusted for mobile */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotate: 10 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ delay: 0.3, type: "spring" }}
                            className="w-full md:w-2/5 flex justify-center mt-6 md:mt-0"
                        >
                            <div className="relative w-32 h-32 md:w-64 md:h-64 bg-white/10 backdrop-blur-xl rounded-[1.5rem] border border-white/20 shadow-2xl flex items-center justify-center transform rotate-3 group-hover:rotate-6 transition-transform duration-500">
                                {React.createElement(slides[current].icon, { className: "text-white text-5xl md:text-8xl drop-shadow-lg" })}
                            </div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>

                {/* Controls */}
                <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                    <button
                        onClick={prevSlide}
                        className="pointer-events-auto p-2 md:p-3 rounded-full bg-black/10 hover:bg-black/30 text-white/50 hover:text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                    >
                        <FaChevronLeft size={20} />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="pointer-events-auto p-2 md:p-3 rounded-full bg-black/10 hover:bg-black/30 text-white/50 hover:text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                    >
                        <FaChevronRight size={20} />
                    </button>
                </div>

                {/* Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrent(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${current === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}
