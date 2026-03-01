'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { InteractiveLoading } from '@/components/shared/InteractiveLoading';

/**
 * Thin client-only component that handles auth redirect.
 * Kept separate so the parent landing page can be a Server Component
 * — allowing Google Bot to crawl the full HTML.
 */
export function ClientRedirect() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push('/home');
        }
    }, [user, loading, router]);

    if (loading || user) {
        return <InteractiveLoading message="Opening Padhaku..." fullScreen />;
    }

    return null;
}
