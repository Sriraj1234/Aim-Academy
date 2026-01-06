'use client';

import dynamic from 'next/dynamic';

// Lazy load non-critical components for faster initial page load
const GameInviteListener = dynamic(() => import('@/components/shared/GameInviteListener').then(mod => ({ default: mod.GameInviteListener })), { ssr: false });
const PresenceListener = dynamic(() => import('@/components/shared/PresenceListener').then(mod => ({ default: mod.PresenceListener })), { ssr: false });
const InstallPrompt = dynamic(() => import('@/components/shared/InstallPrompt').then(mod => ({ default: mod.InstallPrompt })), { ssr: false });
const NotificationPrompt = dynamic(() => import('@/components/shared/NotificationPrompt').then(mod => ({ default: mod.NotificationPrompt })), { ssr: false });

export function ClientLayoutWrapper() {
    return (
        <>
            <PresenceListener />
            <GameInviteListener />
            <InstallPrompt />
            <NotificationPrompt delay={10000} />
        </>
    );
}
