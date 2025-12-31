'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaArrowRight, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import Link from 'next/link'

interface Slide {
    id: number
    title: string
    subtitle: string
    description: string
    image: string // URL or abstract gradient class
    ctaText: string
    ctaLink: string
    bgClass: string
}

const slides: Slide[] = [
    {
        id: 1,
        title: "Toppers Batch 2025",
        subtitle: "Admissions Open",
        description: "Join the most elite batch for Bihar Board Class 10th. Live classes, notes, and 24/7 doubt support.",
        image: "/images/hero-study.jpg", // Placeholder - using gradient in reality
        ctaText: "Enroll Now",
        ctaLink: "/courses",
        bgClass: "bg-gradient-to-r from-indigo-600 to-purple-700"
    },
    {
        id: 2,
        title: "Free Mock Tests",
        subtitle: "Practice & Win",
        description: "Attempt our weekly All India Mock Test and stand a chance to win 100% scholarship.",
        image: "",
        ctaText: "Start Test",
        ctaLink: "/play/selection",
        bgClass: "bg-gradient-to-r from-emerald-500 to-teal-700"
    },
    {
        id: 3,
        title: "Science Animated",
        subtitle: "Visual Learning",
        description: "Understanding Physics and Biology is now easier with our new 3D animated modules.",
        image: "",
        ctaText: "Watch Demo",
        ctaLink: "/demos",
        bgClass: "bg-gradient-to-r from-orange-500 to-red-600"
    }
]

export function HeroCarousel() {
    const [current, setCurrent] = useState(0)
    const [isHovered, setIsHovered] = useState(false)

    // Auto-slide logic
    useEffect(() => {
        if (isHovered) return

        const timer = setInterval(() => {
            setCurrent(prev => (prev + 1) % slides.length)
        }, 3000) // 3 seconds

        return () => clearInterval(timer)
    }, [isHovered])

    const nextSlide = () => setCurrent(prev => (prev + 1) % slides.length)
    const prevSlide = () => setCurrent(prev => (prev - 1 + slides.length) % slides.length)

    // Touch/Swipe Logic
    const swipeConfidenceThreshold = 10000
    const swipePower = (offset: number, velocity: number) => {
        return Math.abs(offset) * velocity
    }

    const paginate = (newDirection: number) => {
        if (newDirection === 1) nextSlide()
        else prevSlide()
    }

    return (
        <section
            className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-8 pb-8 md:pb-12"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative h-[500px] md:h-[500px] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-2xl group touch-pan-y">
                <AnimatePresence initial={false} mode='popLayout'>
                    <motion.div
                        key={current}
                        initial={{ opacity: 0, x: 100 }} // Slide effect
                        animate={{ opacity: 1, x: 0, zIndex: 1 }}
                        exit={{ opacity: 0, x: -100, zIndex: 0 }} // Slide effect
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipe = swipePower(offset.x, velocity.x)

                            if (swipe < -swipeConfidenceThreshold) {
                                paginate(1)
                            } else if (swipe > swipeConfidenceThreshold) {
                                paginate(-1)
                            }
                        }}
                        className={`absolute inset-0 flex items-center justify-center ${slides[current].bgClass} cursor-grab active:cursor-grabbing`}
                    >
                        {/* Abstract Background Elements */}
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                            <div className="absolute top-[-50%] left-[-20%] w-[800px] h-[800px] bg-white rounded-full blur-[100px]" />
                            <div className="absolute bottom-[-50%] right-[-20%] w-[600px] h-[600px] bg-black rounded-full blur-[100px]" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10 text-center px-6 md:px-4 max-w-3xl flex flex-col items-center select-none">
                            <motion.span
                                key={`sub-${current}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="inline-block py-1.5 px-3 md:px-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] md:text-sm font-bold tracking-wider uppercase mb-3 md:mb-4 shadow-sm"
                            >
                                {slides[current].subtitle}
                            </motion.span>

                            <motion.h1
                                key={`title-${current}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-white mb-4 md:mb-6 drop-shadow-lg leading-tight"
                            >
                                {slides[current].title}
                            </motion.h1>

                            <motion.p
                                key={`desc-${current}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-sm sm:text-base md:text-xl text-white/90 mb-6 md:mb-8 leading-relaxed max-w-sm md:max-w-2xl px-2"
                            >
                                {slides[current].description}
                            </motion.p>

                            <motion.div
                                key={`btn-${current}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <Link href={slides[current].ctaLink}>
                                    <button className="bg-white text-gray-900 px-6 py-3 md:px-8 md:py-4 rounded-xl font-bold text-sm md:text-lg hover:bg-gray-100 transition-colors shadow-xl flex items-center gap-2 mx-auto active:scale-95 transform duration-150">
                                        {slides[current].ctaText}
                                        <FaArrowRight />
                                    </button>
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Arrows (Hidden on Mobile, Visible on Desktop Hover) */}
                <button
                    onClick={prevSlide}
                    className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
                >
                    <FaChevronLeft size={24} />
                </button>
                <button
                    onClick={nextSlide}
                    className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
                >
                    <FaChevronRight size={24} />
                </button>

                {/* Dots (Larger tap target on mobile) */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrent(idx)}
                            className={`rounded-full transition-all duration-300 shadow-sm ${current === idx ? 'bg-white w-8 h-2 md:h-3' : 'bg-white/40 hover:bg-white/60 w-2 h-2 md:w-3 md:h-3'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}
