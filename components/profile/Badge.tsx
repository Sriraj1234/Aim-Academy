'use client';

import { motion } from 'framer-motion';
import { FaCrown, FaFire, FaBullseye, FaGamepad, FaLock, FaMedal, FaMoon } from 'react-icons/fa';
import { Badge } from '@/data/types';

const ICON_MAP: Record<string, any> = {
    FaCrown, FaFire, FaBullseye, FaGamepad, FaMedal, FaMoon
};

interface BadgeItemProps {
    badge: Badge;
}

export const BadgeItem = ({ badge }: BadgeItemProps) => {
    const Icon = ICON_MAP[badge.icon] || FaMedal;
    const isUnlocked = badge.isUnlocked;

    return (
        <motion.div
            whileHover={isUnlocked ? { scale: 1.05, y: -2 } : {}}
            className={`
                relative flex flex-col items-center p-4 rounded-xl border text-center transition-all
                ${isUnlocked
                    ? `bg-white border-${badge.color.split('-')[1]}-100 shadow-sm hover:shadow-md`
                    : 'bg-gray-50 border-gray-100 opacity-60 grayscale'
                }
            `}
        >
            <div className={`
                w-12 h-12 rounded-full flex items-center justify-center mb-3 text-xl shadow-inner relative
                ${isUnlocked ? `bg-${badge.color.split('-')[1]}-50 ${badge.color}` : 'bg-gray-200 text-gray-400'}
            `}>
                <Icon />
                {!isUnlocked && (
                    <div className="absolute -bottom-1 -right-1 bg-gray-600 text-white p-1 rounded-full border-2 border-white">
                        <FaLock size={8} />
                    </div>
                )}
            </div>

            <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${isUnlocked ? 'text-gray-800' : 'text-gray-500'}`}>
                {badge.name}
            </h4>

            <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight px-1">
                {badge.description}
            </p>
        </motion.div>
    );
};
