'use client';

import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import VivaSession from '@/components/ai-viva/VivaSession';

export default function AIVivaSelectionPage() {
    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <header className="p-4 flex items-center gap-4 max-w-2xl mx-auto">
                <Link href="/play" className="p-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-gray-500 hover:text-gray-800">
                    <FaArrowLeft />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">Back to Dashboard</h1>
            </header>

            <VivaSession />
        </div>
    );
}
