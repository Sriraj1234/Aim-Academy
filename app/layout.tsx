import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Outfit, Space_Grotesk, Noto_Sans } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { QuizProvider } from '@/context/QuizContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { ClientLayoutWrapper } from '@/components/shared/ClientLayoutWrapper'

import { SpeedInsights } from "@vercel/speed-insights/next"
import { SoundProvider } from '@/context/SoundContext'
import { FriendsProvider } from '@/context/FriendsContext'
import { AdSense } from '@/components/shared/AdSense'
import { JsonLd } from '@/components/shared/JsonLd'


// Fonts with display swap for faster text rendering
const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: true,
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  preload: true,
})

const notoSans = Noto_Sans({
  variable: '--font-noto',
  subsets: ['latin', 'devanagari'],
  weight: ['400', '500', '600'],
  display: 'swap',
  preload: false, // Don't block startup — loads on demand
})

export const metadata: Metadata = {
  title: {
    default: 'Padhaku — Free Bihar Board Online Test | BSEB Class 10 & 12 MCQ 2025',
    template: '%s | Padhaku — Bihar Board'
  },
  description: 'Padhaku is Bihar\'s #1 free online test platform for BSEB Class 10 (Matric) & Class 12 (Inter) 2025. Practice chapter-wise objective questions, viral MCQs, model paper tests, and live quiz battles. 10,000+ students trust Padhaku.',
  keywords: [
    // Core brand
    'Padhaku', 'Padhaku app', 'padhaku.co.in',
    // Bihar Board primary
    'Bihar Board online test', 'BSEB online test', 'Bihar Board MCQ',
    'Bihar Board objective questions', 'Bihar Board 2025',
    // Class 10
    'Bihar Board Class 10', 'BSEB Matric exam', 'Class 10 MCQ Bihar Board',
    'Bihar Board matric objective questions', 'matric exam online test 2025',
    // Class 12
    'Bihar Board Class 12', 'BSEB Inter exam', 'Class 12 MCQ Bihar Board',
    'Bihar Board inter objective questions', 'inter exam online test 2025',
    // Specific
    'Bihar Board viral questions', 'BSEB model paper 2025',
    'Bihar Board Science MCQ', 'Bihar Board Math MCQ', 'Bihar Board Hindi MCQ',
    'Bihar Board Physics MCQ', 'Bihar Board Chemistry MCQ',
    'Online test Bihar Board free', 'BSEB chapter wise MCQ',
    'Bihar Board previous year questions'
  ],
  alternates: {
    canonical: 'https://padhaku.co.in',
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  authors: [{ name: 'Padhaku Team' }],
  creator: 'Padhaku Team',
  publisher: 'Padhaku',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/padhaku-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/padhaku-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/padhaku-192.png', sizes: '192x192', type: 'image/png' }
    ],
    shortcut: '/padhaku-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Padhaku",
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://padhaku.co.in',
    title: 'Padhaku - Ace Your Bihar Board Exams',
    description: 'Join thousands of students on Padhaku. Practice free objective tests, compete in live quizzes, and get ready for BSEB Matric & Inter exams.',
    siteName: 'Padhaku',
    images: [
      {
        url: 'https://padhaku.co.in/assets/og-image.png', // We need to ensure this exists or use a fallback
        width: 1200,
        height: 630,
        alt: 'Padhaku Learning App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Padhaku - Bihar Board Learning App',
    description: 'Free online tests and viral questions for Bihar Board Class 10 & 12. Start practicing now!',
    images: ['https://padhaku.co.in/assets/og-image.png'],
  },
  category: 'education',
  other: {
    "google-adsense-account": "ca-pub-5831377967238754",
  },
  verification: {
    google: "google4aa51faf55a5d0ad",
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Ensure app-like feel
  viewportFit: 'cover',
  themeColor: '#4437B8',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${outfit.variable} ${spaceGrotesk.variable} ${notoSans.variable} antialiased selection:bg-purple-500 selection:text-white overflow-x-hidden w-full`}
        suppressHydrationWarning
      >
        <JsonLd />
        <AdSense />
        <AuthProvider>
          <ThemeProvider>
            <QuizProvider>
              <LanguageProvider>
                <SoundProvider>
                  <FriendsProvider>
                    <Suspense fallback={null}>
                      <ClientLayoutWrapper />
                    </Suspense>
                    <div className="relative w-full max-w-full overflow-x-hidden">
                      {children}
                    </div>
                  </FriendsProvider>
                </SoundProvider>
              </LanguageProvider>
            </QuizProvider>
          </ThemeProvider>
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html >
  )
}
