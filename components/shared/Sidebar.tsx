import React from 'react';
import Link from 'next/link';

export function Sidebar() {
    return (
        <nav className="fixed left-0 top-0 flex-col pt-24 pb-8 h-screen w-72 bg-surface-bleed dark:bg-stone-900 font-body text-base hidden lg:flex border-r border-outline-variant/10 z-40">
            <div className="px-6 mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <img
                        alt="Student Avatar"
                        className="w-12 h-12 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKY06yPTCRkkNWwox1j5IeieTODFYO5S8D8yF_W0F3KMf3P9Zffe-7kDQNEdmO17Mg_n_BXHp8AoXlnESwrvlEnM0YY8ORiCm-K2pwA5By-ztwj_34Si99QmuqOMopkVqGrJUbEzTCCLjXYrvTYxL4un50vFhnPsu5bOvw0kgH0d3OkGz8XbnUvBvJTNS4iCNk4WBEMYB5NRiu2eEwxL7efct8MctWGaTZsRAi2SYCmz05bfajsw8LV9IkdQ4gXVuzmSdFu6zROo-f"
                    />
                    <div>
                        <h3 className="font-bold text-on-surface">Namaste, Scholar</h3>
                        <p className="text-xs text-on-surface-variant line-clamp-1">Saraswati Vidya Mandir</p>
                    </div>
                </div>
                <button className="w-full mt-4 py-3 px-4 bg-primary text-on-primary rounded-full font-semibold shadow-sm hover:scale-[0.98] transition-transform">
                    Start Quiz
                </button>
            </div>
            <div className="flex flex-col gap-1 pr-6">
                <Link
                    href="/home"
                    className="flex items-center gap-4 bg-white dark:bg-stone-800 text-primary font-semibold rounded-r-full py-4 px-6 shadow-sm active:scale-[0.98] transition-transform"
                >
                    <span className="material-symbols-outlined">home</span> Home
                </Link>
                <Link
                    href="/courses"
                    className="flex items-center gap-4 text-on-surface-variant dark:text-[#bbb9b2] py-4 px-6 hover:bg-white/60 dark:hover:bg-stone-800/50 rounded-r-full transition-all active:scale-[0.98]"
                >
                    <span className="material-symbols-outlined">import_contacts</span> Courses
                </Link>
                <Link
                    href="/ai-tools"
                    className="flex items-center gap-4 text-on-surface-variant dark:text-[#bbb9b2] py-4 px-6 hover:bg-white/60 dark:hover:bg-stone-800/50 rounded-r-full transition-all active:scale-[0.98]"
                >
                    <span className="material-symbols-outlined">psychology</span> AI Tools
                </Link>
                <Link
                    href="/community"
                    className="flex items-center gap-4 text-on-surface-variant dark:text-[#bbb9b2] py-4 px-6 hover:bg-white/60 dark:hover:bg-stone-800/50 rounded-r-full transition-all active:scale-[0.98]"
                >
                    <span className="material-symbols-outlined">groups</span> Community
                </Link>
                <Link
                    href="/settings"
                    className="flex items-center gap-4 text-on-surface-variant dark:text-[#bbb9b2] py-4 px-6 hover:bg-white/60 dark:hover:bg-stone-800/50 rounded-r-full transition-all active:scale-[0.98]"
                >
                    <span className="material-symbols-outlined">settings</span> Settings
                </Link>
            </div>
        </nav>
    );
}
