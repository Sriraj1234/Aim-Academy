import React from 'react';
import Link from 'next/link';

export function BottomNav() {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest h-16 flex justify-around items-center z-50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] px-4">
            <Link href="/home" className="flex flex-col items-center gap-1 text-primary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
                <span className="text-[10px] font-bold">Home</span>
            </Link>
            <Link href="/courses" className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined">import_contacts</span>
                <span className="text-[10px]">Courses</span>
            </Link>
            <Link href="/ai-tools" className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined">psychology</span>
                <span className="text-[10px]">AI Tools</span>
            </Link>
            <Link href="/community" className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined">groups</span>
                <span className="text-[10px]">Community</span>
            </Link>
            <Link href="/settings" className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined">settings</span>
                <span className="text-[10px]">Settings</span>
            </Link>
        </nav>
    );
}
