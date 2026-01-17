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
  preload: true,
})

export const metadata: Metadata = {
  title: {
    default: 'Padhaku - Best Bihar Board Learning App for Class 10 & 12',
    template: '%s | Padhaku'
  },
  description: 'Master Bihar Board (BSEB) exams with Padhaku. Free online tests, objective questions, viral questions, and chapter-wise notes for Class 10 & 12 Matric/Inter exams 2025.',
  keywords: [
    'Bihar Board', 'Class 10', 'Class 12', 'Matric Exam 2025', 'Inter Exam 2025',
    'Online Test', 'Objective Questions', 'BSEB', 'Bihar School Examination Board',
    'Padhaku', 'Model Paper 2025', 'Viral Questions'
  ],
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
    icon: '/padhaku-192.png',
    apple: '/padhaku-192.png',
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
  themeColor: '#4437B8',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
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
    </html>
  )
}
