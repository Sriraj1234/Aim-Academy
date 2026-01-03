import React from 'react';
import { WisdomShlok } from '@/types/wisdom';
import { FaPlay, FaPause } from 'react-icons/fa';

interface BookPageContentProps {
    shlok: WisdomShlok;
    isPlaying: boolean;
    onPlayToggle: () => void;
    side: 'left' | 'right'; // 'left' = Sanskrit/Hindi, 'right' = English/Insight
}

export const BookPageContent: React.FC<BookPageContentProps> = ({ shlok, side, isPlaying, onPlayToggle }) => {

    // Left Page: Sanskrit & Hindi
    if (side === 'left') {
        return (
            <div className="h-full w-full p-8 md:p-12 flex flex-col justify-center items-center text-center space-y-8 bg-[#fdfbf7] border-r border-[#e5e5e5] relative overflow-hidden">
                {/* Decorative Borders/Corners could go here */}

                {/* Chapter/Verse Header */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[#8b5e3c] font-serif italic opacity-60 text-sm">
                    Chapter {shlok.chapter} • Verse {shlok.verse}
                </div>

                {/* Sanskrit */}
                <div className="relative">
                    <h2 className="text-2xl md:text-3xl font-bold leading-relaxed text-[#2c1810]" style={{ fontFamily: '"Martel", serif' }}>
                        {shlok.sanskrit.split('\n').map((line, i) => (
                            <span key={i} className="block mb-2">{line}</span>
                        ))}
                    </h2>
                    {/* Decorative underline */}
                    <div className="w-24 h-1 bg-amber-500 mx-auto mt-6 rounded-full opacity-60"></div>
                </div>

                {/* Hindi Meaning */}
                <div className="max-w-md">
                    <p className="text-lg text-[#5d4037] font-medium leading-relaxed" style={{ fontFamily: '"Tiro Devanagari Hindi", serif' }}>
                        {shlok.hindiMeaning}
                    </p>
                </div>
            </div>
        );
    }

    // Right Page: English & Insight
    return (
        <div className="h-full w-full p-8 md:p-12 flex flex-col justify-center items-center text-center space-y-8 bg-[#fdfbf7] relative">
            <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[#8b5e3c] font-serif italic opacity-60 text-sm">
                Wisdom & Application
            </div>

            {/* English Meaning */}
            <div className="max-w-md">
                <p className="text-lg md:text-xl text-[#3e2723] italic leading-relaxed font-serif">
                    “{shlok.englishMeaning}”
                </p>
            </div>

            {/* Student Insight Box */}
            <div className="bg-[#fcf8e3] border border-[#faeeb1] p-6 rounded-xl shadow-inner max-w-sm transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <h4 className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                    <span>✨</span> Student Insight
                </h4>
                <p className="text-sm text-[#5d4037] leading-relaxed">
                    {shlok.studentInsight}
                </p>
            </div>

            {/* Audio Button */}
            <button
                onClick={onPlayToggle}
                className={`mt-4 px-6 py-2.5 rounded-full flex items-center gap-3 transition-all duration-300 shadow-sm border border-amber-200 ${isPlaying ? 'bg-amber-100 text-amber-800' : 'bg-white text-gray-700 hover:bg-amber-50'}`}
            >
                {isPlaying ? <FaPause className="text-xs" /> : <FaPlay className="text-xs" />}
                <span className="text-sm font-semibold tracking-wide uppercase">
                    {isPlaying ? 'Pause Shlok' : 'Listen Shlok'}
                </span>
            </button>
        </div>
    );
};
