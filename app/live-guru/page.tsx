'use client';

import { Header } from '@/components/shared/Header';
import { LiveGuruWidget } from '@/components/live/LiveGuruWidget';

export default function LiveGuruPage() {
    return (
        <div className="min-h-screen bg-slate-950 pb-20 font-sans selection:bg-violet-500 selection:text-white">
            <Header />

            <main className="pt-24 px-4 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
                {/* Header Section */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 px-4 py-2 rounded-full mb-6">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">AI Powered</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                        Live Guru
                    </h1>
                    <p className="text-lg text-slate-400 font-medium mb-2">
                        Real-time Voice AI Assistant
                    </p>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Ask questions, get instant answers. Your personal AI tutor is here to help.
                    </p>
                </div>

                {/* Live Guru Voice Widget */}
                <div className="w-full max-w-md">
                    <LiveGuruWidget />
                </div>

                {/* Features */}
                <div className="mt-16 grid grid-cols-3 gap-8 text-center max-w-lg">
                    <div className="group">
                        <div className="w-12 h-12 mx-auto mb-3 bg-slate-800/80 border border-slate-700/50 rounded-xl flex items-center justify-center group-hover:bg-violet-500/10 group-hover:border-violet-500/30 transition-all">
                            <span className="text-xl">🎤</span>
                        </div>
                        <p className="text-sm text-slate-400 font-medium">Voice Chat</p>
                    </div>
                    <div className="group">
                        <div className="w-12 h-12 mx-auto mb-3 bg-slate-800/80 border border-slate-700/50 rounded-xl flex items-center justify-center group-hover:bg-violet-500/10 group-hover:border-violet-500/30 transition-all">
                            <span className="text-xl">⚡</span>
                        </div>
                        <p className="text-sm text-slate-400 font-medium">Real-time</p>
                    </div>
                    <div className="group">
                        <div className="w-12 h-12 mx-auto mb-3 bg-slate-800/80 border border-slate-700/50 rounded-xl flex items-center justify-center group-hover:bg-violet-500/10 group-hover:border-violet-500/30 transition-all">
                            <span className="text-xl">🎯</span>
                        </div>
                        <p className="text-sm text-slate-400 font-medium">Smart AI</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
