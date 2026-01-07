'use client';

import Script from 'next/script'
import { usePathname } from 'next/navigation'

type Props = {
    pId?: string
}

export const AdSense = ({ pId }: Props) => {
    const pathname = usePathname()
    // Use prop if provided, otherwise fallback to env var, or null
    const publisherId = pId || process.env.NEXT_PUBLIC_ADSENSE_PID

    // Routes where ads should NOT be shown (low content, admin, auth, etc.)
    const excludedRoutes = [
        '/login',
        '/signup',
        '/onboarding',
        '/admin',
        '/profile',
        '/setup-admin'
    ]

    const shouldShowAds = !excludedRoutes.some(route => pathname?.startsWith(route))

    if (!publisherId || !shouldShowAds) return null

    return (
        <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
        />
    )
}
