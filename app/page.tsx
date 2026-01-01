'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LandingHero } from '@/components/home/LandingHero'
import { FeaturesSection } from '@/components/home/FeaturesSection'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'
import { useAuth } from '@/context/AuthContext'
import Image from 'next/image'

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/home')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-royal-gradient flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-400"></div>
      </div>
    )
  }

  // If user is logged in, return null while redirecting
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-pw-surface flex flex-col text-gray-900 font-sans selection:bg-pw-indigo selection:text-white overflow-x-hidden">

      {/* Ambient Glows - Hidden on mobile to prevent content squeeze */}
      <div className="hidden md:block fixed top-[-20%] left-[-10%] w-[40%] h-[40%] bg-pw-indigo/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="hidden md:block fixed bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-pw-violet/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <main className="relative pt-16 z-10 space-y-24 pb-24">

        {/* Modern Hero */}
        <LandingHero />

        {/* Glass Features */}
        <FeaturesSection />

        {/* Royal Testimonials */}
        <TestimonialsSection />

      </main>

      <footer className="relative z-10 bg-white/80 backdrop-blur-md border-t border-pw-border py-12 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-display font-bold text-3xl mb-4 tracking-tight flex items-center justify-center gap-2">
            <span className="text-pw-violet">Padhaku</span>
          </p>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">Empowering Bihar Board Students to achieve excellence through royal education.</p>
          <p className="text-gray-400 text-sm">© 2024 Padhaku. Crafted for Toppers.</p>
          <div className="mt-8 flex justify-center gap-6 opacity-60">
            {/* Social placeholders or links could go here */}
          </div>
        </div>
      </footer>
    </div>
  )
}
