'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlay, FaTrophy, FaStar, FaArrowRight, FaClock, FaChevronLeft, FaChevronRight, FaCrown, FaBolt, FaUserGraduate, FaRocket, FaYoutube } from 'react-icons/fa'
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
        id: 5,
        type: 'ad',
        title: "Happy New Year 2026! ✨",
        subtitle: "Launch Your Dreams",
        description: "Focus, Consistency, and Discipline. Make 2026 your year of academic excellence.",
        ctaText: "Claim 2026 XP Bonus",
        ctaLink: "/leaderboard",
        bgClass: "bg-[conic-gradient(at_bottom_left,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900",
        icon: FaRocket
    },
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
        title: "Weekly All India Mock Test",
        subtitle: "Compete & Win",
        description: "Test your preparation against students across India. Win scholarships and prizes.",
        ctaText: "Register Now",
        ctaLink: "/play/selection",
        bgClass: "bg-gradient-to-br from-indigo-500 to-blue-600",
        icon: FaTrophy
    },

    {
        id: 6,
        type: 'ad',
        title: "Free Study Hub",
        subtitle: "No Ads • Just Learning",
        description: "We've curated the best free educational videos for you. (Note: We do not claim rights to content; we just organize it to save your time!)",
        ctaText: "Start Learning",
        ctaLink: "/study-hub",
        bgClass: "bg-gradient-to-br from-red-600 to-pink-600",
        icon: FaYoutube
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
        ...adSlides,
        {
            id: 1,
            type: 'personal',
            bgClass: "bg-gradient-to-br from-[#4f46e5] to-[#7c3aed]",
            icon: FaUserGraduate
        }
    ]

    // State for slide direction (1 for next, -1 for prev) to animate correctly
    const [direction, setDirection] = useState(0);

    // Auto-slide logic
    useEffect(() => {
        if (isHovered) return
        const timer = setInterval(() => {
            nextSlide()
        }, 5000)
        return () => clearInterval(timer)
    }, [isHovered, slides.length])

    const nextSlide = () => {
        setDirection(1);
        setCurrent(prev => (prev + 1) % slides.length);
    }

    const prevSlide = () => {
        setDirection(-1);
        setCurrent(prev => (prev - 1 + slides.length) % slides.length);
    }

    // Animation Variants
    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0,
            scale: 0.95
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0,
            scale: 0.95
        })
    };

    // Helper to render content based on slide type
    const renderContent = (slide: Slide) => {
        // ... (Keep existing render logic, just ensuring classes are clean)
        if (slide.type === 'personal') {
            return (
                <div className="flex flex-col items-center md:items-start text-center md:text-left h-full justify-center pt-2">
                    <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-white/15 backdrop-blur-md rounded-full mb-2 md:mb-4">
                        <span className="text-amber-300 text-[10px]"><FaStar /></span>
                        <span className="text-white text-[9px] md:text-xs font-bold tracking-wider uppercase">{streak} Day Streak</span>
                    </div>

                    <h1 className="text-xl md:text-5xl font-black text-white leading-tight mb-1 md:mb-3 drop-shadow-md">
                        Welcome Back,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-200">{name}!</span>
                    </h1>

                    <p className="text-indigo-100 text-xs md:text-lg font-medium mb-3 md:mb-6 max-w-xs md:max-w-lg leading-relaxed line-clamp-1 md:line-clamp-none">
                        Continue your preparation with today's challenge!
                    </p>

                    <Link href="/play/selection" className="w-full md:w-auto">
                        <button className="w-auto px-4 py-2 bg-white text-indigo-700 rounded-lg font-bold text-xs md:text-base shadow-lg hover:shadow-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 active:scale-95 group/btn mx-auto">
                            <span>Practice</span>
                            <FaArrowRight className="group-hover/btn:translate-x-1 transition-transform text-[10px]" />
                        </button>
                    </Link>
                </div>
            )
        }

        // Standard Ad Slide Content
        return (
            <div className="flex flex-col items-center md:items-start text-center md:text-left h-full justify-center pt-2 relative z-10">
                <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-white/10 backdrop-blur-md rounded-full mb-2 md:mb-4 border border-white/10">
                    <span className="text-amber-300 text-[9px] md:text-xs font-bold tracking-wider uppercase">{slide.subtitle}</span>
                </div>

                <h1 className="text-xl md:text-5xl font-black text-white leading-tight mb-1 md:mb-3 drop-shadow-md">
                    {slide.id === 5 ? (
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 drop-shadow-sm">
                            {slide.title}
                        </span>
                    ) : (
                        slide.title
                    )}
                </h1>

                <p className="text-white/90 text-xs md:text-lg font-medium mb-3 md:mb-6 max-w-xs md:max-w-lg leading-relaxed line-clamp-1 md:line-clamp-none">
                    {slide.description}
                </p>

                <Link href={slide.ctaLink || '/'} className="w-full md:w-auto">
                    <button className={`w-auto px-4 py-2 ${slide.id === 5 ? 'bg-gradient-to-r from-amber-500 to-yellow-600 border border-yellow-400/50 text-white' : 'bg-white text-gray-900'} rounded-lg font-bold text-xs md:text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 group/btn mx-auto`}>
                        <span>{slide.ctaText}</span>
                        <FaArrowRight className="group-hover/btn:translate-x-1 transition-transform text-[10px]" />
                    </button>
                </Link>
            </div>
        )
    }

    return (
        <section
            className="w-full max-w-7xl mx-auto mb-8 font-sans relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Fixed Aspect Ratio Container for Stability */}
            <div className="relative w-full aspect-[16/9] md:aspect-[21/9] md:rounded-2xl overflow-hidden md:border md:border-pw-border md:shadow-pw-md bg-gray-900 group">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.div
                        key={current}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipe = offset.x;
                            if (swipe < -50) nextSlide();
                            else if (swipe > 50) prevSlide();
                        }}
                        className={`absolute inset-0 ${slides[current].bgClass} w-full h-full p-4 md:p-12 flex flex-col md:flex-row items-center justify-center md:justify-between cursor-grab active:cursor-grabbing`}
                    >
                        {/* Special Background for New Year Slide */}
                        {slides[current].id === 5 && (
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <div className="hidden md:block absolute -right-10 top-10 text-[120px] md:text-[250px] font-black text-white/5 md:text-white/5 leading-none tracking-tighter select-none z-0">
                                    2026
                                </div>
                                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.3)_100%)]" />
                                {/* Floating particles */}
                                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-amber-400 rounded-full animate-ping opacity-75" />
                                <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-purple-400 rounded-full animate-pulse opacity-75" />
                            </div>
                        )}
                        {/* Background Decor - Made subtler - Hidden on Mobile */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
                            <div className="absolute -top-20 -right-20 w-40 h-40 md:w-60 md:h-60 bg-white opacity-5 rounded-full blur-[50px]" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 md:w-40 md:h-40 bg-black opacity-10 rounded-full blur-[40px]" />
                        </div>

                        {/* Content Area */}
                        <div className="relative z-10 w-full md:w-3/5 text-center md:text-left flex flex-col items-center md:items-start justify-center h-full pb-4 md:pb-0">
                            {renderContent(slides[current])}
                        </div>

                        {/* Graphic Area - Hidden on small mobile to save space, visible on larger phones/desktop */}
                        <div className="hidden sm:flex relative z-0 md:w-2/5 justify-center items-center">
                            <div className="relative w-20 h-20 md:w-48 md:h-48 rounded-2xl flex items-center justify-center transform rotate-3 transition-transform duration-500">
                                {React.createElement(slides[current].icon, { className: "text-white/20 md:text-white text-6xl md:text-8xl drop-shadow-lg" })}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Controls - Hidden on Mobile Touch, Visible on Desktop Hover */}
                <div className="hidden md:flex absolute inset-0 items-center justify-between px-4 pointer-events-none">
                    <button onClick={prevSlide} className="pointer-events-auto p-3 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100">
                        <FaChevronLeft size={20} />
                    </button>
                    <button onClick={nextSlide} className="pointer-events-auto p-3 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100">
                        <FaChevronRight size={20} />
                    </button>
                </div>

                {/* Indicators - Micro dots, minimal visibility - Hidden on Mobile if causing issues */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 hidden md:flex gap-1.5 z-20">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setDirection(idx > current ? 1 : -1);
                                setCurrent(idx);
                            }}
                            className={`w-1 h-1 rounded-full transition-all duration-300 ${current === idx ? 'bg-white shadow-lg scale-125' : 'bg-white/20'}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}
