import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://padhaku.co.in'
    const now = new Date()

    return [
        // ── Core Pages (highest priority) ────────────────────────────────
        {
            url: baseUrl,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/play/quiz`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 0.95,
        },
        {
            url: `${baseUrl}/study-hub`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/leaderboard`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 0.85,
        },

        // ── Authentication & Onboarding ───────────────────────────────────
        {
            url: `${baseUrl}/login`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.7,
        },

        // ── Static / Informational ─────────────────────────────────────────
        {
            url: `${baseUrl}/about`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.7,
        },

        // ── Legal ──────────────────────────────────────────────────────────
        {
            url: `${baseUrl}/privacy`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.4,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.4,
        },
        {
            url: `${baseUrl}/refund`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ]
}
