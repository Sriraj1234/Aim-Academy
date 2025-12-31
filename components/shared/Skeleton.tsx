'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Skeleton loader component for loading states
 */
export function Skeleton({
    className = '',
    variant = 'rectangular',
    width,
    height,
    animation = 'pulse',
}: SkeletonProps) {
    const baseClasses = 'bg-gray-200 dark:bg-gray-700';

    const variantClasses = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: '',
        rounded: 'rounded-xl',
    };

    const animationClasses = {
        pulse: 'animate-pulse',
        wave: '',
        none: '',
    };

    const style = {
        width: width || '100%',
        height: height || (variant === 'text' ? '1em' : '100%'),
    };

    if (animation === 'wave') {
        return (
            <motion.div
                className={`${baseClasses} ${variantClasses[variant]} ${className} overflow-hidden relative`}
                style={style}
            >
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                />
            </motion.div>
        );
    }

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
            style={style}
        />
    );
}

/**
 * Card skeleton for loading states
 */
export function CardSkeleton({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm ${className}`}>
            <div className="flex items-center gap-4 mb-4">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1">
                    <Skeleton variant="text" width="60%" height={20} className="mb-2" />
                    <Skeleton variant="text" width="40%" height={16} />
                </div>
            </div>
            <Skeleton variant="rounded" height={100} className="mb-4" />
            <div className="flex gap-2">
                <Skeleton variant="rounded" width={80} height={32} />
                <Skeleton variant="rounded" width={80} height={32} />
            </div>
        </div>
    );
}

/**
 * List skeleton for loading states
 */
export function ListSkeleton({ count = 5, className = '' }: { count?: number; className?: string }) {
    return (
        <div className={`space-y-3 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl">
                    <Skeleton variant="circular" width={40} height={40} />
                    <div className="flex-1">
                        <Skeleton variant="text" width="70%" height={18} className="mb-1" />
                        <Skeleton variant="text" width="40%" height={14} />
                    </div>
                    <Skeleton variant="rounded" width={60} height={28} />
                </div>
            ))}
        </div>
    );
}

/**
 * Quiz option skeleton
 */
export function QuizOptionSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={60} className="w-full" />
            ))}
        </div>
    );
}

/**
 * Dashboard stats skeleton
 */
export function StatsSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4">
                    <Skeleton variant="text" width="50%" height={14} className="mb-2" />
                    <Skeleton variant="text" width="70%" height={28} />
                </div>
            ))}
        </div>
    );
}
