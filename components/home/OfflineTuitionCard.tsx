'use client';

import { useRouter } from 'next/navigation';
import { FaMapMarkerAlt, FaChalkboardTeacher, FaArrowRight } from 'react-icons/fa';

export const OfflineTuitionCard = () => {
    const router = useRouter();

    return (
        <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            {/* Background Patterns */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl -ml-10 -mb-10" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-2xl shadow-inner border border-white/20">
                        🏠
                    </div>
                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/10 shadow-sm uppercase tracking-wider">
                        New Feature
                    </span>
                </div>

                <h3 className="text-xl font-display font-bold mb-2 leading-tight">
                    Find Offline Tuitions <br /> Near You
                </h3>

                <p className="text-white/90 text-sm font-medium mb-6 leading-relaxed max-w-[90%]">
                    Connect with best local teachers and coaching centers in your area.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={() => router.push('/offline')}
                        className="flex-1 bg-white text-orange-600 px-4 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 group-hover:gap-3"
                    >
                        <FaMapMarkerAlt /> Find Now <FaArrowRight className="text-xs transition-transform group-hover:translate-x-1" />
                    </button>

                    <button
                        onClick={() => router.push('/offline/register')}
                        className="px-4 py-3 bg-black/20 hover:bg-black/30 backdrop-blur-md text-white rounded-xl font-bold text-xl shadow-inner border border-white/10 transition-all flex items-center justify-center"
                        title="Register as Tutor"
                    >
                        <FaChalkboardTeacher />
                    </button>
                </div>
            </div>
        </div>
    );
};
