'use client';

import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';

// Lazy load non-critical components for faster initial page load
const GameInviteListener = dynamic(() => import('@/components/shared/GameInviteListener').then(mod => ({ default: mod.GameInviteListener })), { ssr: false });
const PresenceListener = dynamic(() => import('@/components/shared/PresenceListener').then(mod => ({ default: mod.PresenceListener })), { ssr: false });
const InstallPrompt = dynamic(() => import('@/components/shared/InstallPrompt').then(mod => ({ default: mod.InstallPrompt })), { ssr: false });
const NotificationPrompt = dynamic(() => import('@/components/shared/NotificationPrompt').then(mod => ({ default: mod.NotificationPrompt })), { ssr: false });
const ReferralCapture = dynamic(() => import('@/components/shared/ReferralCapture').then(mod => ({ default: mod.ReferralCapture })), { ssr: false });

export function ClientLayoutWrapper() {
    const [readyForBackgroundWork, setReadyForBackgroundWork] = useState(false);

    useEffect(() => {
        if ('requestIdleCallback' in window) {
            const idleId = window.requestIdleCallback(() => setReadyForBackgroundWork(true), { timeout: 2000 });
            return () => window.cancelIdleCallback(idleId);
        }

        const timer = setTimeout(() => setReadyForBackgroundWork(true), 1200);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            {readyForBackgroundWork && (
                <>
                    <PresenceListener />
                    <GameInviteListener />
                    <InstallPrompt />
                    <NotificationPrompt delay={10000} />
                    <ReferralCapture />
                </>
            )}
            <Toaster position="top-center" toastOptions={{ duration: 3000, style: { background: '#333', color: '#fff', borderRadius: '12px' } }} />
        </>
    );
}
