'use client';

import { AIQuestionGenerator } from './AIQuestionGenerator';
import { AIFlashcardGenerator } from './AIFlashcardGenerator';
import { ChapterSummary } from './ChapterSummary';

export const AIStudyToolsGrid = () => {
    return (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-xl shadow-indigo-100/50">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <span className="text-2xl bg-gradient-to-br from-indigo-500 to-purple-500 bg-clip-text text-transparent">🤖</span>
                AI Study Power Tools
                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100 uppercase tracking-wider font-bold">Beta</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Practice Questions */}
                <div className="h-full">
                    <AIQuestionGenerator />
                </div>

                {/* 2. Flashcards */}
                <div className="h-full">
                    <AIFlashcardGenerator />
                </div>

                {/* 3. Summarizer */}
                <div className="h-full">
                    <ChapterSummary />
                </div>

            </div>

            <p className="text-xs text-gray-400 text-center mt-6 font-medium">
                Powered by Advanced AI • Helping you learn faster ⚡
            </p>
        </div>
    );
};
