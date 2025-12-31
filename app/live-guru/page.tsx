import { Header } from '@/components/shared/Header';

export default function LiveGuruPage() {
    return (
        <div className="min-h-screen bg-royal-gradient pb-20 font-sans selection:bg-purple-500 selection:text-white">
            <Header />

            <main className="pt-24 px-4 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-4 drop-shadow-lg">
                        Live Guru <span className="text-gold-gradient">Coming Soon</span>
                    </h1>
                    <p className="text-lg text-purple-200 font-medium max-w-xl mx-auto">
                        We are currently refining the Real-time AI Voice Tutor experience to give you the best learning journey. Stay tuned!
                    </p>
                </div>
            </main>
        </div>
    );
}
