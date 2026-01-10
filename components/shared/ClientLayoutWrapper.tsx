'use client';

import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';

// Lazy load non-critical components for faster initial page load
const GameInviteListener = dynamic(() => import('@/components/shared/GameInviteListener').then(mod => ({ default: mod.GameInviteListener })), { ssr: false });
const PresenceListener = dynamic(() => import('@/components/shared/PresenceListener').then(mod => ({ default: mod.PresenceListener })), { ssr: false });
const InstallPrompt = dynamic(() => import('@/components/shared/InstallPrompt').then(mod => ({ default: mod.InstallPrompt })), { ssr: false });
const NotificationPrompt = dynamic(() => import('@/components/shared/NotificationPrompt').then(mod => ({ default: mod.NotificationPrompt })), { ssr: false });
const ReferralCapture = dynamic(() => import('@/components/shared/ReferralCapture').then(mod => ({ default: mod.ReferralCapture })), { ssr: false });

export function ClientLayoutWrapper() {
    return (
        <>
            <PresenceListener />
            <GameInviteListener />
            <InstallPrompt />
            <NotificationPrompt delay={10000} />
            <ReferralCapture />
            <Toaster position="top-center" toastOptions={{ duration: 3000, style: { background: '#333', color: '#fff', borderRadius: '12px' } }} />
        </>
    );
}
