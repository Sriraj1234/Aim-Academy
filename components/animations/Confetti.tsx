'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Particle {
    id: number
    x: number
    y: number
    rotation: number
    color: string
    size: number
    velocity: { x: number; y: number }
}

const colors = [
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#ef4444', // red
    '#ec4899', // pink
    '#06b6d4', // cyan
]

export const Confetti = ({
    active = false,
    duration = 3000,
    particleCount = 50
}: {
    active?: boolean
    duration?: number
    particleCount?: number
}) => {
    const [particles, setParticles] = useState<Particle[]>([])
    const [isActive, setIsActive] = useState(false)

    useEffect(() => {
        if (active && !isActive) {
            setIsActive(true)

            // Generate particles
            const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
                id: i,
                x: 50 + (Math.random() - 0.5) * 30,
                y: 40,
                rotation: Math.random() * 360,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 8 + 4,
                velocity: {
                    x: (Math.random() - 0.5) * 15,
                    y: Math.random() * -15 - 5
                }
            }))

            setParticles(newParticles)

            // Clear after duration
            setTimeout(() => {
                setParticles([])
                setIsActive(false)
            }, duration)
        }
    }, [active, duration, particleCount, isActive])

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            <AnimatePresence>
                {particles.map((particle) => (
                    <motion.div
                        key={particle.id}
                        initial={{
                            x: `${particle.x}vw`,
                            y: `${particle.y}vh`,
                            rotate: 0,
                            opacity: 1,
                            scale: 1
                        }}
                        animate={{
                            x: `${particle.x + particle.velocity.x * 10}vw`,
                            y: `${particle.y + 100}vh`,
                            rotate: particle.rotation * 3,
                            opacity: 0,
                            scale: 0.5
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: duration / 1000,
                            ease: [0.25, 0.46, 0.45, 0.94]
                        }}
                        style={{
                            position: 'absolute',
                            width: particle.size,
                            height: particle.size,
                            backgroundColor: particle.color,
                            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        }}
                    />
                ))}
            </AnimatePresence>
        </div>
    )
}
