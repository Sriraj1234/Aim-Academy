'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { FaCheck, FaTimes } from 'react-icons/fa'

interface ModernOptionButtonProps {
    label: string
    optionText: string
    selected: boolean
    correct?: boolean | null // null = unknown (not locked), true = correct, false = incorrect
    onClick: () => void
    disabled: boolean
}

// Shake animation for wrong answers
const shakeAnimation = {
    x: [0, -10, 10, -10, 10, -5, 5, 0],
    transition: { duration: 0.5, ease: "easeInOut" }
}

// Celebration pulse for correct
const celebrateAnimation = {
    scale: [1, 1.05, 1],
    transition: { duration: 0.4, ease: "easeOut" }
}

export const ModernOptionButton = ({
    label,
    optionText,
    selected,
    correct,
    onClick,
    disabled
}: ModernOptionButtonProps) => {

    // Determine visuals based on state
    let borderColor = 'border-pw-border'
    let bgColor = 'bg-white'
    let textColor = 'text-gray-700'
    let shadow = 'shadow-pw-sm'
    let labelBg = 'bg-pw-surface text-gray-500'
    let gradientBorder = ''

    if (selected && (correct === null || correct === undefined)) {
        // Selected but not locked - Vibrant selection state
        borderColor = 'border-pw-indigo'
        bgColor = 'bg-pw-surface'
        textColor = 'text-pw-indigo'
        shadow = 'shadow-pw-md'
        labelBg = 'bg-gradient-to-br from-pw-indigo to-pw-violet text-white'
        gradientBorder = 'ring-2 ring-pw-indigo/30'
    } else if (correct === true) {
        // Correct Answer - Green celebration state
        borderColor = 'border-green-500'
        bgColor = 'bg-green-50'
        textColor = 'text-green-800'
        shadow = 'shadow-md shadow-green-500/10'
        labelBg = 'bg-green-500 text-white'
        gradientBorder = 'ring-2 ring-green-400/30'
    } else if (correct === false && selected) {
        // Wrong Selection - Red shake state
        borderColor = 'border-pw-red'
        bgColor = 'bg-red-50'
        textColor = 'text-pw-red'
        shadow = 'shadow-md shadow-pw-red/10'
        labelBg = 'bg-pw-red text-white'
    }

    // Determine animation
    const animate = correct === false && selected ? shakeAnimation :
        correct === true ? celebrateAnimation : {}

    return (
        <motion.button
            whileHover={!disabled ? { scale: 1.02, y: -3 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            animate={animate}
            onClick={onClick}
            disabled={disabled}
            className={`
                w-full relative overflow-hidden group
                flex items-center gap-4 p-4 md:p-5 rounded-2xl border-2 transition-all duration-300
                text-left
                ${borderColor} ${bgColor} ${textColor} ${shadow} ${gradientBorder}
                ${!disabled && !selected ? 'hover:border-pw-indigo/50 hover:shadow-pw-md hover:bg-pw-surface transition-colors' : ''}
                ${disabled && !selected && !correct ? 'opacity-60 grayscale' : ''}
            `}
        >
            {/* Label Circle (A, B, C...) */}
            <motion.div
                className={`
                    flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-300
                    ${labelBg}
                `}
                animate={selected && (correct === null || correct === undefined) ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
            >
                {correct === true ? <FaCheck className="text-lg" /> :
                    correct === false && selected ? <FaTimes className="text-lg" /> :
                        label}
            </motion.div>

            {/* Text */}
            <div className={`flex-grow font-medium text-base md:text-lg leading-snug ${selected ? 'font-bold' : ''}`}>
                {optionText}
            </div>

            {/* Floating checkmark for correct */}
            <AnimatePresence>
                {correct === true && (
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute -right-3 -top-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                    >
                        <FaCheck className="text-white text-sm" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pulse ring on selection */}
            {selected && (correct === null || correct === undefined) && (
                <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-pw-indigo pointer-events-none"
                    animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.02, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                />
            )}

            {/* Success shimmer on correct */}
            {correct === true && (
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                />
            )}
        </motion.button>
    )
}

