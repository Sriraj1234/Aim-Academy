'use client'

import { motion } from 'framer-motion'
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa'

interface OptionButtonProps {
    label: string
    optionText: string
    selected?: boolean
    correct?: boolean | null
    onClick?: () => void
    disabled?: boolean
}

export const OptionButton = ({
    label,
    optionText,
    selected = false,
    correct = null, // null = not revealed, true = correct, false = wrong
    onClick,
    disabled = false
}: OptionButtonProps) => {

    let stateStyles = 'bg-white border-2 border-surface-off hover:border-brand-200'
    let textStyles = 'text-text-main'
    let labelStyles = 'bg-surface-off text-text-sub'

    if (selected && correct === null) {
        stateStyles = 'bg-brand-50 border-2 border-brand-500'
        textStyles = 'text-brand-900 font-medium'
        labelStyles = 'bg-brand-500 text-white'
    } else if (correct === true) {
        stateStyles = 'bg-green-50 border-2 border-green-500'
        textStyles = 'text-green-900 font-medium'
        labelStyles = 'bg-green-500 text-white'
    } else if (selected && correct === false) {
        stateStyles = 'bg-red-50 border-2 border-red-500'
        textStyles = 'text-red-900 font-medium'
        labelStyles = 'bg-red-500 text-white'
    }

    return (
        <motion.button
            whileTap={!disabled ? { scale: 0.98 } : {}}
            onClick={onClick}
            disabled={disabled}
            className={`
        w-full p-4 rounded-xl flex items-center gap-4 transition-all duration-200 text-left relative overflow-hidden group
        ${stateStyles}
        ${disabled ? 'cursor-default' : 'cursor-pointer'}
      `}
        >
            <div className={`
         w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 transition-colors
         ${labelStyles}
       `}>
                {label}
            </div>

            <div className={`flex-grow ${textStyles} text-lg`}>
                {optionText}
            </div>

            {correct === true && <FaCheckCircle className="text-2xl text-green-500" />}
            {correct === false && selected && <FaTimesCircle className="text-2xl text-red-500" />}
        </motion.button>
    )
}
