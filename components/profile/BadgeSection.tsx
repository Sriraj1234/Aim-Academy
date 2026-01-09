'use client';

import { Badge } from '@/data/types';
import { BadgeItem } from './Badge';
import { motion } from 'framer-motion';
import { FaMedal } from 'react-icons/fa';

interface BadgeSectionProps {
    badges: Badge[];
}

export const BadgeSection = ({ badges }: BadgeSectionProps) => {
    const unlockedCount = badges.filter(b => b.isUnlocked).length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 border border-pw-border shadow-pw-md mb-8"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                        <FaMedal className="text-lg" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-pw-violet">Achievements</h3>
                        <p className="text-xs text-gray-500 font-medium">
                            {unlockedCount} / {badges.length} Unlocked
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(unlockedCount / badges.length) * 100}%` }}
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badges.map((badge) => (
                    <BadgeItem key={badge.id} badge={badge} />
                ))}
            </div>
        </motion.div>
    );
};
