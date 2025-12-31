import type { Metadata } from 'next'
import { Outfit, Space_Grotesk, Noto_Sans } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { QuizProvider } from '@/context/QuizContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { GameInviteListener } from '@/components/shared/GameInviteListener'
import { PresenceListener } from '@/components/shared/PresenceListener'

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
  title: 'AIM Academy - Bihar Board Exam Practice',
  description: 'Master Bihar Board exams with interactive quizzes, detailed explanations, and live competitive battles.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7c3aed',
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
        className={`${outfit.variable} ${spaceGrotesk.variable} ${notoSans.variable} antialiased selection:bg-purple-500 selection:text-white`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ThemeProvider>
            <QuizProvider>
              <LanguageProvider>
                <PresenceListener />
                <GameInviteListener />
                {children}
              </LanguageProvider>
            </QuizProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
