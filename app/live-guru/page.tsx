'use client';

import { Header } from '@/components/shared/Header';
import { LiveGuruWidget } from '@/components/live/LiveGuruWidget';

export default function LiveGuruPage() {
    return (
        <div className="min-h-screen bg-royal-gradient pb-20 font-sans selection:bg-purple-500 selection:text-white">
            <Header />

            <main className="pt-24 px-4 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-4 drop-shadow-lg">
                        Live Guru <span className="text-gold-gradient">Sri Raj AI</span>
                    </h1>
                    <p className="text-lg text-purple-200 font-medium max-w-xl mx-auto mb-8">
                        Real-time AI Voice Tutor - Apne doubts seedha bolo, Sri Raj tumhe samjhayega! 🎙️
                    </p>
                </div>

                {/* Live Guru Voice Widget */}
                <div className="w-full max-w-md">
                    <LiveGuruWidget />
                </div>
            </main>
        </div>
    );
}
