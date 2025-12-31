'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'

export const FloatingBlob = ({
    className = '',
    delay = 0
}: {
    className?: string
    delay?: number
}) => {
    // Compute random duration once on mount to avoid impure render
    const duration = useMemo(() => 10 + Math.random() * 5, [])

    return (
        <motion.div
            className={`absolute rounded-full blur-3xl opacity-30 mix-blend-multiply filter pointer-events-none ${className}`}
            animate={{
                y: [0, -30, 0],
                scale: [1, 1.1, 1],
                rotate: [0, 10, -10, 0],
            }}
            transition={{
                duration,
                repeat: Infinity,
                repeatType: "reverse",
                delay: delay,
                ease: "easeInOut",
            }}
        />
    )
}
