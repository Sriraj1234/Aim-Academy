'use client';

import { Batch } from '@/data/types';
import { FaLayerGroup, FaCalendarAlt, FaBookOpen } from 'react-icons/fa';

interface BatchCardProps {
    batch: Batch;
    actionButton: React.ReactNode;
}

export default function BatchCard({ batch, actionButton }: BatchCardProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
            {/* Thumbnail */}
            <div className="h-40 bg-gray-200 relative group">
                {batch.thumbnailUrl ? (
                    <img src={batch.thumbnailUrl} alt={batch.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FaLayerGroup size={32} />
                    </div>
                )}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm uppercase">
                    {batch.status}
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-1" title={batch.name}>{batch.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{batch.description}</p>

                {/* Meta Info */}
                <div className="space-y-2 mb-4 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                        <FaBookOpen className="text-brand-500" />
                        <span>{batch.subjects.length > 0 ? batch.subjects.join(', ') : 'All Subjects'}</span>
                    </div>
                    {batch.startDate && (
                        <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-brand-500" />
                            <span>Starts: {batch.startDate}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <div>
                        <span className="text-xs text-gray-400 block">Price</span>
                        <span className="font-bold text-lg text-brand-600">₹{batch.price || 'Free'}</span>
                    </div>
                    {actionButton}
                </div>
            </div>
        </div>
    );
}
