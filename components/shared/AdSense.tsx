'use client';

import Script from 'next/script'
import { usePathname } from 'next/navigation'

import { useAuth } from '@/context/AuthContext'

type Props = {
    pId?: string
}

export const AdSense = ({ pId }: Props) => {
    const { userProfile } = useAuth()
    const pathname = usePathname()

    // Use prop if provided, otherwise fallback to env var, or null
    const publisherId = pId || process.env.NEXT_PUBLIC_ADSENSE_PID

    const isPro = userProfile?.subscription?.plan === 'pro'

    // Routes where ads ARE allowed (High value content only)
    const allowedRoutes = [
        '/notes',
        '/study-hub',
        '/blog' // Future proofing
    ]

    const shouldShowAds = allowedRoutes.some(route => pathname?.startsWith(route))

    if (!publisherId || !shouldShowAds || isPro) return null

    return (
        <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
        />
    )
}
