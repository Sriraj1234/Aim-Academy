import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export function DashboardHeader() {
    const { user, userProfile } = useAuth();
    
    // Fallback names
    const firstName = userProfile?.name?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Scholar';

    return (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-end">
            <div className="lg:col-span-2 space-y-2">
                <span className="text-primary font-bold tracking-widest uppercase text-xs md:text-sm">Padhaku App</span>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-on-surface leading-tight font-headline">
                    Suprabhat, {firstName}!
                </h1>
                <p className="text-on-surface-variant text-base md:text-lg max-w-xl">
                    Your consistent practice is paying off. You&apos;re closer to your goal today than you were yesterday.
                </p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-5 md:p-6 shadow-sm border border-outline-variant/10">
                <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-on-surface">Daily Progress</span>
                    <span className="text-primary font-bold">65%</span>
                </div>
                <div className="w-full bg-surface-variant rounded-full h-3 md:h-4 overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all" style={{ width: '65%' }}></div>
                </div>
                <p className="mt-3 text-xs md:text-sm text-on-surface-variant italic">
                    Only 3 more modules to complete today&apos;s goal!
                </p>
            </div>
        </section>
    );
}
