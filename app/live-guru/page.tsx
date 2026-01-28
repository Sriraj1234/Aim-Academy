'use client';

import { Header } from '@/components/shared/Header';
import { LiveGuruWidget } from '@/components/live/LiveGuruWidget';

export default function LiveGuruPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-950 to-gray-900 pb-20 font-sans selection:bg-purple-500 selection:text-white">
            <Header />

            <main className="pt-24 px-4 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-block mb-4">
                        <span className="text-purple-400 text-lg">ॐ</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-2 drop-shadow-lg">
                        <span className="bg-gradient-to-r from-purple-300 via-pink-200 to-purple-300 bg-clip-text text-transparent">
                            सरस्वती
                        </span>
                    </h1>
                    <p className="text-xl text-purple-200/80 font-medium mb-2">
                        Saraswati • AI Voice Tutor
                    </p>
                    <p className="text-base text-purple-300/60 max-w-md mx-auto mb-8">
                        अपने doubts seedha bolo, माँ सरस्वती समझाएंगी! 🎙️
                    </p>

                    {/* Sanskrit Quote */}
                    <div className="inline-block px-6 py-3 bg-white/5 rounded-2xl border border-purple-500/20 mb-8">
                        <p className="text-purple-300/70 text-sm italic">
                            "या कुन्देन्दुतुषारहारधवला या शुभ्रवस्त्रावृता"
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                            Saraswati Vandana - Prayer to Goddess of Knowledge
                        </p>
                    </div>
                </div>

                {/* Live Guru Voice Widget */}
                <div className="w-full max-w-md">
                    <LiveGuruWidget />
                </div>

                {/* Features */}
                <div className="mt-12 grid grid-cols-3 gap-4 text-center max-w-md">
                    <div className="p-3">
                        <div className="text-2xl mb-2">🎤</div>
                        <p className="text-xs text-gray-400">Voice Chat</p>
                    </div>
                    <div className="p-3">
                        <div className="text-2xl mb-2">📚</div>
                        <p className="text-xs text-gray-400">Bihar Board</p>
                    </div>
                    <div className="p-3">
                        <div className="text-2xl mb-2">🆓</div>
                        <p className="text-xs text-gray-400">Free to Use</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
