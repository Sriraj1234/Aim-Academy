import { motion } from 'framer-motion';
import { useState } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { SafeAvatar } from '@/components/shared/SafeAvatar';
import { UserBadge } from '@/components/shared/UserBadge';
import { FriendRequest } from '@/data/types';

interface RequestItemProps {
    req: FriendRequest;
    onAccept: (uid: string) => Promise<void>;
    onReject: (uid: string) => Promise<void>;
    idx: number;
}

export const RequestItem = ({ req, onAccept, onReject, idx }: RequestItemProps) => {
    const [actionLoading, setActionLoading] = useState<'accept' | 'reject' | null>(null);

    const handleAction = async (action: 'accept' | 'reject') => {
        setActionLoading(action);
        try {
            if (action === 'accept') {
                await onAccept(req.uid);
            } else {
                await onReject(req.uid);
            }
        } catch (e) {
            console.error(e);
            setActionLoading(null);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-pw-sm border border-pw-border dark:border-slate-800"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="relative shrink-0 w-10 h-10">
                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 border border-pw-border">
                        <SafeAvatar
                            src={req.photoURL}
                            alt={req.displayName}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <UserBadge size="sm" className="-top-1 -right-1" userProfile={req} showDefault={false} />
                </div>
                <div>
                    <h3 className="font-bold text-pw-violet dark:text-white">{req.displayName}</h3>
                    <p className="text-xs text-pw-indigo font-medium">Wants to be your friend</p>
                </div>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => handleAction('accept')}
                    disabled={!!actionLoading}
                    className="flex-1 bg-pw-indigo text-white py-2.5 rounded-xl text-sm font-bold shadow-pw-md hover:bg-pw-violet disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                    {actionLoading === 'accept' ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <FaCheck /> Accept
                        </>
                    )}
                </button>
                <button
                    onClick={() => handleAction('reject')}
                    disabled={!!actionLoading}
                    className="flex-1 bg-pw-surface dark:bg-slate-800 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl text-sm font-bold border border-pw-border dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:text-pw-red transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                    {actionLoading === 'reject' ? (
                        <span className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" />
                    ) : (
                        <>
                            <FaTimes /> Reject
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
};
