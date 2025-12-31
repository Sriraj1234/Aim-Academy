'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlay, FaTrophy, FaStar, FaArrowRight, FaClock, FaChevronLeft, FaChevronRight, FaCrown, FaBolt, FaUserGraduate } from 'react-icons/fa'
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
                <div className="flex flex-col items-center md:items-start text-center md:text-left h-full justify-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full border border-white/20 mb-3 md:mb-4">
                        <span className="text-amber-300"><FaStar /></span>
                        <span className="text-white text-[10px] md:text-xs font-bold tracking-wider uppercase">{streak} Day Streak</span>
                    </div>

                    <h1 className="text-2xl md:text-5xl font-black text-white leading-tight mb-2 md:mb-3 drop-shadow-md">
                        Welcome Back,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-200">{name}!</span>
                    </h1>

                    <p className="text-indigo-100 text-sm md:text-lg font-medium mb-4 md:mb-6 max-w-xs md:max-w-lg leading-relaxed line-clamp-2 md:line-clamp-none">
                        Continue your preparation with today's daily challenge and boost your rank!
                    </p>

                    <Link href="/play/selection" className="w-full md:w-auto">
                        <button className="w-full md:w-auto px-6 py-3 bg-white text-indigo-700 rounded-xl font-bold text-sm md:text-base shadow-lg hover:shadow-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 active:scale-95 group/btn">
                            <span>Continue Practice</span>
                            <FaArrowRight className="group-hover/btn:translate-x-1 transition-transform text-xs" />
                        </button>
                    </Link>
                </div>
            )
        }

        // Standard Ad Slide Content
        return (
            <div className="flex flex-col items-center md:items-start text-center md:text-left h-full justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-3 md:mb-4">
                    <span className="text-white text-[10px] md:text-xs font-bold tracking-wider uppercase">{slide.subtitle}</span>
                </div>

                <h1 className="text-2xl md:text-5xl font-black text-white leading-tight mb-2 md:mb-3 drop-shadow-md">
                    {slide.title}
                </h1>

                <p className="text-white/90 text-sm md:text-lg font-medium mb-4 md:mb-6 max-w-xs md:max-w-lg leading-relaxed line-clamp-2 md:line-clamp-none">
                    {slide.description}
                </p>

                <Link href={slide.ctaLink || '/'} className="w-full md:w-auto">
                    <button className="w-full md:w-auto px-6 py-3 bg-white text-gray-900 rounded-xl font-bold text-sm md:text-base shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2 active:scale-95 group/btn">
                        <span>{slide.ctaText}</span>
                        <FaArrowRight className="group-hover/btn:translate-x-1 transition-transform text-xs" />
                    </button>
                </Link>
            </div>
        )
    }

    return (
        <section
            className="w-full max-w-7xl mx-auto mb-8 font-sans relative px-4 md:px-0"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Fixed Aspect Ratio Container for Stability */}
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-xl bg-gray-900 group">
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
                        className={`absolute inset-0 ${slides[current].bgClass} w-full h-full p-6 md:p-12 flex flex-col-reverse md:flex-row items-center justify-between cursor-grab active:cursor-grabbing`}
                    >
                        {/* Content Area */}
                        <div className="relative z-10 w-full md:w-3/5 mt-4 md:mt-0">
                            {renderContent(slides[current])}
                        </div>

                        {/* Graphic Area - Top on Mobile, Right on Desktop */}
                        <div className="relative z-0 w-full md:w-2/5 flex justify-center items-center h-40 md:h-full">
                            <div className="relative w-28 h-28 md:w-48 md:h-48 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl flex items-center justify-center transform rotate-3 transition-transform duration-500">
                                {React.createElement(slides[current].icon, { className: "text-white text-5xl md:text-8xl drop-shadow-lg" })}
                            </div>
                        </div>

                        {/* Background Decor */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white opacity-10 rounded-full blur-[60px]" />
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-black opacity-10 rounded-full blur-[50px]" />
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

                {/* Indicators - Small dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setDirection(idx > current ? 1 : -1);
                                setCurrent(idx);
                            }}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${current === idx ? 'bg-white' : 'bg-white/30'}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}
