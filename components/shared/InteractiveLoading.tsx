'use client';

import Image from 'next/image';

interface InteractiveLoadingProps {
    message?: string;
    fullScreen?: boolean;
}

export function InteractiveLoading({ message = "Loading your personalized content...", fullScreen = true }: InteractiveLoadingProps) {
    const containerClasses = fullScreen
        ? "fixed inset-0 z-[120] flex items-center justify-center bg-pw-surface px-6"
        : "flex items-center justify-center p-8 bg-pw-surface rounded-2xl";

    return (
        <div className={containerClasses}>
            <div className="w-full max-w-xs text-center">
                <div className="relative mx-auto mb-5 h-24 w-24">
                    <div className="absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-pw-indigo to-pw-violet opacity-15 blur-xl" />
                    <div className="absolute inset-2 rounded-[1.35rem] border border-pw-indigo/15 bg-white shadow-pw-md dark:bg-slate-900" />
                    <div className="absolute inset-0 rounded-[1.75rem] border-2 border-pw-indigo/15 border-t-pw-indigo animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Image
                            src="/padhaku-192.png"
                            alt="Padhaku"
                            width={52}
                            height={52}
                            priority
                            className="rounded-2xl shadow-sm"
                        />
                    </div>
                </div>

                <h3 className="text-lg font-black text-pw-violet">
                    {message}
                </h3>
                <div className="mx-auto mt-4 h-1.5 w-44 overflow-hidden rounded-full bg-pw-indigo/10">
                    <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-pw-indigo to-pw-violet loading-bar" />
                </div>
            </div>
        </div>
    );
}
