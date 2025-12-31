import React from 'react'
import { motion } from 'framer-motion'

interface CardProps {
    children: React.ReactNode
    className?: string
    onClick?: () => void
    hover?: boolean
}

export const Card = ({ children, className = '', onClick, hover = false }: CardProps) => {
    return (
        <motion.div
            onClick={onClick}
            whileHover={hover ? { y: -5, transition: { duration: 0.2 } } : {}}
            className={`
        bg-white rounded-2xl p-6 shadow-card border border-surface-off
        ${hover ? 'hover:shadow-soft cursor-pointer' : ''}
        ${className}
      `}
        >
            {children}
        </motion.div>
    )
}
