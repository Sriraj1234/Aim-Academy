import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const modules = [
    { title: 'Play with Friends', icon: 'sports_esports', colorClass: 'bg-primary-fixed-dim/20 text-primary', link: '/play/battle/room' },
    { title: 'Chapter wise', icon: 'auto_stories', colorClass: 'bg-secondary-container/30 text-secondary', link: '/play/selection' },
    { title: 'Subject wise', icon: 'science', colorClass: 'bg-tertiary-container/30 text-tertiary', link: '/play/selection' },
    { title: 'Mistake Notebook', icon: 'menu_book', colorClass: 'bg-error-container/20 text-error', link: '/mistakes' },
    { title: 'My Batches', icon: 'group_work', colorClass: 'bg-primary-fixed/30 text-on-primary-fixed-variant', link: '/batches' },
    { title: 'Study Hub', icon: 'hub', colorClass: 'bg-on-tertiary-container/10 text-on-tertiary-container', link: '/study-hub' },
    { title: 'Brain Warmup', icon: 'bolt', colorClass: 'bg-secondary-fixed/30 text-on-secondary-fixed-variant', link: '/play/mind-game' },
    { title: 'Snap & Solve', icon: 'photo_camera', colorClass: 'bg-primary-dim/10 text-primary-dim', link: '/play/snap-solve' },
    { title: 'Syllabus Tracker', icon: 'analytics', colorClass: 'bg-tertiary-fixed/30 text-on-tertiary-fixed-variant', link: '/syllabus' },
];

export function StudyModules() {
    return (
        <section className="space-y-4 md:space-y-6">
            <div className="flex justify-between items-end">
                <h2 className="text-xl md:text-2xl font-bold text-on-surface font-headline">Study Modules</h2>
                <Link href="/courses" className="text-primary font-semibold text-sm md:text-base hover:underline">
                    View All Modules
                </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
                {modules.map((mod, i) => (
                    <Link href={mod.link} key={i}>
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-surface-container-low p-4 md:p-6 rounded-2xl text-center space-y-3 md:space-y-4 hover:bg-surface-container-lowest transition-all cursor-pointer group shadow-sm hover:shadow-md border border-outline-variant/5 h-full flex flex-col justify-center"
                        >
                            <div className={`w-12 h-12 md:w-14 md:h-14 ${mod.colorClass.split(' ')[0]} rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform`}>
                                <span className={`material-symbols-outlined ${mod.colorClass.split(' ')[1]} text-2xl md:text-3xl`}>
                                    {mod.icon}
                                </span>
                            </div>
                            <span className="block font-bold text-on-surface text-sm md:text-base leading-tight">
                                {mod.title}
                            </span>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
