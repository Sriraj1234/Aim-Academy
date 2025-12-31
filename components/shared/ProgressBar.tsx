'use client'

import { motion } from 'framer-motion'

export const ProgressBar = ({
    currentStep,
    totalSteps
}: {
    currentStep: number
    totalSteps: number
}) => {
    return (
        <div className="w-full flex items-center gap-2 mb-8">
            {Array.from({ length: totalSteps }).map((_, index) => (
                <div key={index} className="flex-1 h-2 bg-surface-off rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: index <= currentStep ? '100%' : '0%' }}
                        transition={{ duration: 0.5 }}
                        className={`h-full rounded-full ${index <= currentStep ? 'bg-brand-500' : 'bg-transparent'}`}
                    />
                </div>
            ))}
        </div>
    )
}
