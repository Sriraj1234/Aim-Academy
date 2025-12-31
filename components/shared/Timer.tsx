'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaClock } from 'react-icons/fa'
import { useTimer } from '@/hooks/useTimer'

interface TimerProps {
    duration: number // in seconds
    onTimeUp?: () => void
}

export const Timer = ({ duration, onTimeUp }: TimerProps) => {
    const { timeLeft } = useTimer(duration, onTimeUp)

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const isCritical = timeLeft <= 10

    return (
        <div className={`
      flex items-center gap-2 px-3 py-1.5 rounded-full font-mono font-bold text-sm transition-colors border
      ${isCritical
                ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                : 'bg-white text-text-sub border-surface-off'}
    `}>
            <FaClock className={isCritical ? 'animate-bounce' : ''} />
            <span>{formatTime(timeLeft)}</span>
        </div>
    )
}
