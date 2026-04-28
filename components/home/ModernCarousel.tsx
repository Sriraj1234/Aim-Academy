'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaTrophy, FaStar, FaArrowRight, FaChevronLeft, FaChevronRight, FaCrown, FaUserGraduate, FaYoutube } from 'react-icons/fa'
import Link from 'next/link'
import NextImage from 'next/image'
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
    image?: string
}

const adSlides: Slide[] = [

    {
        id: 2,
        type: 'ad',
        title: "Toppers Batch 2025",
        subtitle: "Admissions Open",
        description: "Join the most elite batch for Class 10th. Live classes, notes, and 24/7 doubt support.",
        ctaText: "Enroll Now",
        ctaLink: "/batches",
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
    // ... [No changes to existing logic hooks]
    const { user, userProfile } = useAuth()
    const [current, setCurrent] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const frame = requestAnimationFrame(() => setMounted(true))
        return () => cancelAnimationFrame(frame)
    }, [])

    // Dynamic First Slide Data
    const name = user?.displayName?.split(' ')[0] || userProfile?.displayName?.split(' ')[0] || 'Topper'
    const streak = userProfile?.gamification?.currentStreak || 0

    // Combine Personal Slide + Ads
    const slides: Slide[] = useMemo(() => [
        ...adSlides,
        {
            id: 1,
            type: 'personal',
            bgClass: "bg-gradient-to-br from-[#4f46e5] to-[#7c3aed]",
            icon: FaUserGraduate
        }
    ], [])
    const [direction, setDirection] = useState(0);

    const nextSlide = useCallback(() => {
        setDirection(1);
        setCurrent(prev => (prev + 1) % slides.length);
    }, [slides.length])

    const prevSlide = useCallback(() => {
        setDirection(-1);
        setCurrent(prev => (prev - 1 + slides.length) % slides.length);
    }, [slides.length])

    // Auto-slide logic
    useEffect(() => {
        if (isHovered) return
        const timer = setInterval(() => {
            nextSlide()
        }, 5000)
        return () => clearInterval(timer)
    }, [isHovered, nextSlide])

    // Animation Variants
    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0,
            scale: 0.98
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
            scale: 0.98
        })
    };

    // Helper to render content based on slide type
    const renderContent = (slide: Slide) => {
        if (slide.type === 'personal') {
            return (
                <div className="flex h-full w-full flex-col items-start justify-center text-left relative z-20 px-1 sm:px-2 md:px-0">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full mb-3 shadow-sm border border-white/10">
                        <span className="text-amber-300 text-[10px] md:text-xs drop-shadow-md"><FaStar /></span>
                        <span className="text-white text-[10px] md:text-xs font-bold tracking-wider uppercase">{streak} Day Streak</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight mb-2 drop-shadow-xl" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                        Welcome Back,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-200 drop-shadow-sm">{name}!</span>
                    </h1>

                    <p className="text-indigo-100 text-xs sm:text-sm md:text-base font-medium mb-4 md:mb-5 max-w-sm md:max-w-lg leading-snug md:leading-relaxed drop-shadow-md">
                        Continue your preparation with today's challenge!
                    </p>

                    <Link href="/play/selection" className="w-full sm:w-auto">
                        <button className="w-full max-w-[220px] sm:max-w-none sm:w-auto px-5 py-2.5 sm:px-6 sm:py-3 !bg-white !text-indigo-700 rounded-xl font-bold text-sm md:text-base shadow-xl hover:shadow-2xl hover:!bg-indigo-50 transition-all flex items-center justify-center gap-2 active:scale-95 group/btn">
                            <span>Practice</span>
                            <FaArrowRight className="group-hover/btn:translate-x-1 transition-transform text-xs" />
                        </button>
                    </Link>
                </div>
            )
        }

        // Standard Ad Slide Content
        return (
            <div className="flex h-full w-full flex-col items-start justify-center text-left relative z-20 px-1 sm:px-2 md:px-0">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full mb-2 md:mb-3 border border-white/20 shadow-lg">
                    <span className="text-amber-300 text-[10px] sm:text-xs font-bold tracking-wider uppercase drop-shadow-md">{slide.subtitle}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight mb-2 md:mb-3 drop-shadow-2xl max-w-2xl" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                    {slide.title}
                </h1>

                <p className="text-white/95 font-medium mb-4 md:mb-5 max-w-sm md:max-w-xl leading-snug md:leading-relaxed text-xs sm:text-sm md:text-base drop-shadow-lg">
                    {slide.description}
                </p>

                <Link href={slide.ctaLink || '/'} className="w-full sm:w-auto border-transparent border">
                    <button className={`w-full max-w-[220px] sm:max-w-none sm:w-auto px-5 py-2.5 sm:px-6 sm:py-3 md:px-7 md:py-3 ${slide.id === 6 ? '!bg-white !text-red-600 hover:!bg-red-50' : '!bg-white !text-indigo-700 hover:!bg-indigo-50'} rounded-xl font-bold text-sm md:text-base shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 active:scale-95 group/btn ring-2 ring-white/30 ring-offset-1 ring-offset-transparent`}>
                        <span>{slide.ctaText}</span>
                        <FaArrowRight className="group-hover/btn:translate-x-1 transition-transform text-xs" />
                    </button>
                </Link>
            </div>
        )
    }

    if (!mounted) {
        return (
            <section className="w-full max-w-7xl mx-auto mb-6 md:mb-8 font-sans relative px-0">
                <div className="relative w-full h-[220px] sm:h-[250px] md:h-[300px] lg:h-[320px] rounded-2xl overflow-hidden bg-gray-900/10 animate-pulse">
                </div>
            </section>
        )
    }

    return (
        <section
            className="w-full max-w-7xl mx-auto mb-6 md:mb-8 font-sans relative px-0"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative w-full h-[220px] sm:h-[250px] md:h-[300px] lg:h-[320px] rounded-2xl overflow-hidden shadow-lg md:shadow-pw-md bg-transparent group border-none touch-pan-y">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.div
                        key={current}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 360, damping: 36, mass: 0.8 },
                            opacity: { duration: 0.14 }
                        }}
                        drag="x"
                        dragDirectionLock
                        dragElastic={0.12}
                        dragMomentum={false}
                        onDragEnd={(_e, { offset }) => {
                            const swipe = offset.x;
                            if (swipe < -50) nextSlide();
                            else if (swipe > 50) prevSlide();
                        }}
                        className={`absolute inset-0 ${slides[current].bgClass} w-full h-full p-5 sm:p-6 md:p-8 lg:p-10 flex flex-row items-center justify-between cursor-grab active:cursor-grabbing overflow-hidden will-change-transform`}
                    >
                        {/* Render Background Image if present */}
                        {slides[current].image && (
                            <>
                                <div className="absolute inset-0 z-0">
                                    <NextImage
                                        src={slides[current].image!}
                                        alt={slides[current].title || 'Banner'}
                                        fill
                                        className="object-cover opacity-90 scale-105 group-hover:scale-110 transition-transform duration-[20s]"
                                        priority={true}
                                        quality={85}
                                    />
                                    {/* Gradient Overlay for Text Readability */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent md:from-black/90 md:via-black/50 md:to-transparent" />
                                </div>
                            </>
                        )}

                        {/* Background Decor - Only show if NO image, or show simplified decor */}
                        {!slides[current].image && (
                            <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
                                <div className="absolute -top-20 -right-20 w-40 h-40 md:w-60 md:h-60 bg-white opacity-5 rounded-full blur-[50px]" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 md:w-40 md:h-40 bg-black opacity-10 rounded-full blur-[40px]" />
                            </div>
                        )}

                        {/* Content Area */}
                        <div className="relative z-10 w-[72%] sm:w-3/5 text-left flex flex-col items-start justify-center h-full">
                            {renderContent(slides[current])}
                        </div>

                        <div className="relative z-0 flex w-[28%] sm:w-2/5 justify-center items-center">
                            <div className="relative flex h-24 w-24 sm:h-32 sm:w-32 md:h-44 md:w-44 items-center justify-center rounded-[2rem] bg-white/10 backdrop-blur-sm ring-1 ring-white/10">
                                <div className="flex h-20 w-20 sm:h-28 sm:w-28 md:h-36 md:w-36 rounded-[1.5rem] items-center justify-center">
                                    {React.createElement(slides[current].icon, { className: "text-white/80 text-5xl sm:text-6xl md:text-7xl drop-shadow-2xl" })}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Controls - Hidden on Mobile Touch, Visible on Desktop Hover */}
                <div className="hidden md:flex absolute inset-0 items-center justify-between px-4 pointer-events-none">
                    <button onClick={prevSlide} className="pointer-events-auto p-3 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100" aria-label="Previous slide">
                        <FaChevronLeft size={20} />
                    </button>
                    <button onClick={nextSlide} className="pointer-events-auto p-3 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100" aria-label="Next slide">
                        <FaChevronRight size={20} />
                    </button>
                </div>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            aria-label={`Go to slide ${idx + 1}`}
                            onClick={() => {
                                setDirection(idx > current ? 1 : -1);
                                setCurrent(idx);
                            }}
                            className={`h-2 rounded-full transition-all duration-300 ${current === idx ? 'w-5 bg-white shadow-lg' : 'w-2 bg-white/35'}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}

