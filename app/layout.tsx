import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { Outfit, Space_Grotesk, Noto_Sans } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { QuizProvider } from '@/context/QuizContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { GameInviteListener } from '@/components/shared/GameInviteListener'
import { PresenceListener } from '@/components/shared/PresenceListener'
import { InstallPrompt } from '@/components/shared/InstallPrompt'

import { SpeedInsights } from "@vercel/speed-insights/next"
import { SoundProvider } from '@/context/SoundContext'

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
})

const notoSans = Noto_Sans({
  variable: '--font-noto',
  subsets: ['latin', 'devanagari'],
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'Padhaku - Bihar Board Exam Practice',
  description: 'Master Bihar Board exams with interactive quizzes, detailed explanations, and live competitive battles on Padhaku.',
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
    <html lang="en" suppressHydrationWarning>
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
        <AuthProvider>
          <ThemeProvider>
            <QuizProvider>
              <LanguageProvider>
                <SoundProvider>
                  <PresenceListener />
                  <GameInviteListener />
                  <InstallPrompt />
                  <Toaster position="top-center" toastOptions={{ duration: 3000, style: { background: '#333', color: '#fff', borderRadius: '12px' } }} />
                  <div className="relative w-full max-w-full overflow-x-hidden">
                    {children}
                  </div>
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
