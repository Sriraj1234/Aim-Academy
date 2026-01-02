'use client'

import { motion } from 'framer-motion'

interface ScoreCircleProps {
    score: number;
    total: number;
    size?: number;
}

export const ScoreCircle = ({ score, total, size = 192 }: ScoreCircleProps) => {
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0
    const radius = size * 0.35
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = isNaN(percentage) ? circumference : circumference - (percentage / 100) * circumference
    const center = size / 2

    // Dynamic Color & Label based on score
    let colorClass = "text-pw-indigo";
    let gradientId = "gradient-brand";
    let label = "Keep Going";

    if (percentage >= 90) {
        colorClass = "text-yellow-500";
        gradientId = "gradient-gold";
        label = "Legendary!";
    } else if (percentage >= 75) {
        colorClass = "text-green-500";
        gradientId = "gradient-green";
        label = "Excellent!";
    } else if (percentage >= 50) {
        colorClass = "text-blue-500";
        gradientId = "gradient-blue";
        label = "Good Job";
    }

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="w-full h-full transform -rotate-90">
                <defs>
                    <linearGradient id="gradient-brand" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4437B8" />
                        <stop offset="100%" stopColor="#ABA3EC" />
                    </linearGradient>
                    <linearGradient id="gradient-gold" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#D97706" />
                        <stop offset="100%" stopColor="#F59E0B" />
                    </linearGradient>
                    <linearGradient id="gradient-green" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#059669" />
                        <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                    <linearGradient id="gradient-blue" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#2563EB" />
                        <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                </defs>

                {/* Background Track */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-pw-border"
                />

                {/* Animated Progress Circle */}
                <motion.circle
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={`url(#${gradientId})`}
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    className="filter drop-shadow-[0_4px_10px_rgba(20,13,82,0.15)]"
                />
            </svg>

            {/* Inner Content */}
            <div className="absolute flex flex-col items-center justify-center inset-0">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col items-center"
                >
                    <span className="text-5xl font-black text-pw-violet font-display tracking-tight">
                        {percentage}%
                    </span>
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className={`mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white border border-pw-border shadow-sm ${colorClass}`}
                    >
                        {label}
                    </motion.div>
                </motion.div>
            </div>

            {/* Decorative Glow */}
            <div className={`absolute inset-0 bg-${colorClass.replace('text-', '')}/10 blur-3xl -z-10 rounded-full scale-75`} />
        </div>
    )
}
