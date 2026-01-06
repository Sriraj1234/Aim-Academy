'use client';

import Script from 'next/script'

type Props = {
    pId?: string
}

export const AdSense = ({ pId }: Props) => {
    // Use prop if provided, otherwise fallback to env var, or null
    const publisherId = pId || process.env.NEXT_PUBLIC_ADSENSE_PID

    if (!publisherId) return null

    return (
        <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
        />
    )
}
