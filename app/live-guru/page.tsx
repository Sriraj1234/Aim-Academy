'use client';

import { Header } from '@/components/shared/Header';
import { LiveGuruWidget } from '@/components/live/LiveGuruWidget';

export default function LiveGuruPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-950 to-gray-900 pb-20 font-sans selection:bg-purple-500 selection:text-white">
            <Header />

            <main className="pt-24 px-4 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
                {/* Header Section */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-6">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-purple-300 text-xs font-medium uppercase tracking-wider">AI Powered</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                        Live Guru
                    </h1>
                    <p className="text-lg text-purple-200 font-medium mb-2">
                        Real-time Voice AI Tutor
                    </p>
                    <p className="text-purple-300/60 max-w-md mx-auto">
                        Ask questions, get instant answers. Your personal AI tutor is here to help with Bihar Board studies.
                    </p>
                </div>

                {/* Live Guru Voice Widget */}
                <div className="w-full max-w-md">
                    <LiveGuruWidget />
                </div>

                {/* Features */}
                <div className="mt-16 grid grid-cols-3 gap-8 text-center max-w-lg">
                    <div className="group">
                        <div className="w-12 h-12 mx-auto mb-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/10 group-hover:border-purple-500/30 transition-all">
                            <span className="text-xl">🎤</span>
                        </div>
                        <p className="text-sm text-purple-200 font-medium">Voice Chat</p>
                    </div>
                    <div className="group">
                        <div className="w-12 h-12 mx-auto mb-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/10 group-hover:border-purple-500/30 transition-all">
                            <span className="text-xl">⚡</span>
                        </div>
                        <p className="text-sm text-purple-200 font-medium">Real-time</p>
                    </div>
                    <div className="group">
                        <div className="w-12 h-12 mx-auto mb-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/10 group-hover:border-purple-500/30 transition-all">
                            <span className="text-xl">📚</span>
                        </div>
                        <p className="text-sm text-purple-200 font-medium">Bihar Board</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
