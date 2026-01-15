import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript - ignore build errors for faster builds
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache
    remotePatterns: [
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.google.com' },
      { protocol: 'https', hostname: '**.unsplash.com' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
    ],
  },

  // Enable compression
  // compress: true,

  // Experimental features - disabled for stability
  // experimental: {
  //   optimizeCss: true, // CSS optimization
  //   optimizePackageImports: [
  //     'react-icons',
  //     'framer-motion',
  //     '@google/generative-ai',
  //   ],
  // },

  // Headers for caching and performance
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:all*(js|css)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  // Reduce bundle size by not including source maps in production
  productionBrowserSourceMaps: false,

  // Faster page loading
  poweredByHeader: false,
};

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swMinify: true,
  disable: process.env.NODE_ENV === "development", // Disable PWA in development
  workboxOptions: {
    disableDevLogs: true,
    importScripts: ["/firebase-messaging-sw.js"],
    // Runtime caching for API routes and external resources
    runtimeCaching: [
      {
        // 1. DATA & API: Network First (Freshness Priority)
        // We want real-time features (Social Hub, Quiz Results) to always look for new data.
        urlPattern: /^https:\/\/padhaku\.co\.in\/api\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24, // 1 day fallback
          },
          networkTimeoutSeconds: 10, // Wait 10s for network, then use cache
        },
      },
      {
        // 2. PAGES (Next.js Data): Network First
        // Ensures verify/result pages are fresh.
        urlPattern: /\/_next\/data\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'next-data',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          },
        },
      },
      {
        // 3. FONTS: Cache First (Stability)
        // These never change, so we lock them in cache forever.
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-stylesheets',
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-webfonts',
          expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
      {
        // 4. IMAGES: Stale While Revalidate (Speed)
        // Show cached image instantly, check for update in background.
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'images',
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
    ],
  },
});

export default withPWA(nextConfig);
