
import React from 'react';
import { FaShieldAlt, FaCrown, FaFire } from 'react-icons/fa';

interface BadgeProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    userProfile?: any;
    showDefault?: boolean;
}

export const UserBadge: React.FC<BadgeProps> = ({ className = '', size = 'md', userProfile, showDefault = false }) => {

    // Size logic
    const containerSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
    const textSize = size === 'sm' ? 'text-[8px]' : size === 'lg' ? 'text-xs' : 'text-[10px]';

    // Debugging
    // console.log("UserBadge Profile:", userProfile?.displayName, userProfile?.subscription);

    // 1. Pro Badge (Highest Priority)
    const isPro = userProfile?.subscription?.plan === 'pro' && userProfile?.subscription?.status === 'active';

    // 2. Streak Badge (Secondary)
    const isStreakMaster = !isPro && (userProfile?.gamification?.currentStreak || 0) >= 30;

    // Logic: Return null if no badge earned AND no default requested
    if (!isPro && !isStreakMaster && !showDefault) {
        return null;
    }

    // Default Fallback
    const isDefault = !isPro && !isStreakMaster;

    return (
        <div className={`absolute -bottom-1 -right-1 bg-white border-2 border-white rounded-full p-0.5 shadow-sm z-10 ${className}`}
            title={isPro ? "Pro Scholar" : isStreakMaster ? "Monthly Master" : "Scholar"}>
            <div className={`
                ${containerSize} rounded-full flex items-center justify-center ${textSize} text-white font-bold
                ${isPro ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                    isStreakMaster ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                        'bg-gradient-to-r from-blue-400 to-indigo-500'}
            `}>
                {isPro ? <FaCrown /> : isStreakMaster ? <FaFire /> : <FaShieldAlt />}
            </div>
        </div>
    );
};
